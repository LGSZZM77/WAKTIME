import express from "express";
import sharp from "sharp";
import puppeteer from "puppeteer";

async function getBrowser() {
  return puppeteer.launch({
    executablePath: puppeteer.executablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-accelerated-2d-canvas",
    ],
    headless: true,
    protocolTimeout: 60000,
    timeout: 60000,
  });
}

const fanArtRouter = express.Router();
let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2시간 캐시

fanArtRouter.get("/", async (req, res) => {
  const currentTime = Date.now();

  if (
    cachedData &&
    lastFetchTime &&
    currentTime - lastFetchTime < CACHE_DURATION
  ) {
    return res.json(cachedData);
  }

  const data = await getFanArtData();
  cachedData = data;
  lastFetchTime = currentTime;

  res.setHeader("Cache-Control", "public, max-age=1800"); // 30분 캐시
  res.json(data);
});

fanArtRouter.get("/image-proxy", async (req, res) => {
  const imageUrlParam = req.query.url;
  if (typeof imageUrlParam !== "string") {
    return res.status(400).send("이미지 URL이 필요합니다");
  }
  const format = req.query.format || "auto";
  const width = req.query.width ? parseInt(req.query.width) : null;
  const height = req.query.height ? parseInt(req.query.height) : null;
  const quality = req.query.quality ? parseInt(req.query.quality) : 80;
  const cleanUrl = imageUrlParam.split("?")[0];

  try {
    const response = await fetch(cleanUrl);
    if (!response.ok)
      return res
        .status(response.status)
        .send("이미지를 가져오는데 실패했습니다");
    const buffer = await response.arrayBuffer();
    let image = sharp(Buffer.from(buffer));

    if (width || height) {
      image = image.resize({
        width: width || undefined,
        height: height || undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    let outputFormat = format;
    const userAgent = req.headers["user-agent"] || "";
    if (format === "auto") {
      const supportsWebP = ["Chrome", "Edge", "Opera"].some((b) =>
        userAgent.includes(b)
      );
      outputFormat = supportsWebP ? "webp" : "jpeg";
    }

    let outputBuffer;
    switch (outputFormat) {
      case "webp":
        outputBuffer = await image.webp({ quality }).toBuffer();
        res.setHeader("Content-Type", "image/webp");
        break;
      case "png":
        outputBuffer = await image.png({ compressionLevel: 9 }).toBuffer();
        res.setHeader("Content-Type", "image/png");
        break;
      case "jpeg":
      default:
        outputBuffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
        res.setHeader("Content-Type", "image/jpeg");
    }

    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(outputBuffer);
  } catch (error) {
    console.error("이미지 프록시 에러:", error);
    res.status(500).send("이미지를 처리하는데 실패했습니다");
  }
});

fanArtRouter.get("/thumbnail", async (req, res) => {
  const url = req.query.url;
  if (typeof url !== "string")
    return res.status(400).send("이미지 URL이 필요합니다");
  const width = req.query.width ? parseInt(req.query.width) : 300;
  const height = req.query.height ? parseInt(req.query.height) : null;
  const quality = req.query.quality ? parseInt(req.query.quality) : 70;
  const clean = url.split("?")[0];

  try {
    const response = await fetch(clean);
    if (!response.ok)
      return res
        .status(response.status)
        .send("이미지를 가져오는데 실패했습니다");
    const buffer = await response.arrayBuffer();
    const thumbnail = await sharp(Buffer.from(buffer))
      .resize({
        width,
        height: height || undefined,
        fit: "cover",
        position: "entropy",
      })
      .webp({ quality })
      .toBuffer();

    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", "image/webp");
    res.send(thumbnail);
  } catch (error) {
    console.error("썸네일 생성 에러:", error);
    res.status(500).send("이미지를 처리하는데 실패했습니다");
  }
});

async function getFanArtData() {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );

    // 리소스 로딩 최적화
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        req.resourceType() === "image" ||
        req.resourceType() === "stylesheet" ||
        req.resourceType() === "font"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const target =
      "https://cafe.naver.com/f-e/cafes/27842958/menus/551?viewType=I&page=1";

    console.log(`🌐 팬아트 페이지 접속 시도 중: ${target}`);

    await page.goto(target, {
      waitUntil: "domcontentloaded", // 더 빠른 로드 조건 사용
      timeout: 60000,
    });

    // 필요한 선택자가 로드될 때까지만 기다림
    await page.waitForSelector(".article-album-view .item", { timeout: 60000 });

    const items = await scrapeAlbumItems(page);
    console.log(`✅ 팬아트 ${items.length}개 수집 완료`);
    return items;
  } catch (err) {
    console.error("❌ 팬아트 스크래핑 실패:", err.message);
    return []; // 실패해도 서버가 죽지 않게 빈 배열 반환
  } finally {
    // 메모리 누수 방지를 위해 반드시 페이지와 브라우저 닫기
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error("페이지 닫기 실패:", e);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error("브라우저 닫기 실패:", e);
      }
    }
  }
}

async function scrapeAlbumItems(page) {
  const nodes = await page.$$(".article-album-view .item");
  const levelNames = {
    아메바: 0,
    진드기: 1,
    닭둘기: 2,
    왁무새: 3,
    침팬치: 4,
    느그자: 5,
  };
  const items = [];

  try {
    for (const item of nodes) {
      try {
        const href = await item.$eval("a.thumbLink", (el) => el.href);
        const raw = await item.$eval("picture.DefaultImage source", (el) =>
          el.getAttribute("srcset")
        );
        const thumbnail = raw.split(" ")[0].split("?")[0];
        const title = await item.$eval(".tit_txt", (el) =>
          el.textContent.trim()
        );

        let commentCount = 0;
        try {
          commentCount =
            parseInt(
              await item.$eval(
                "a.comment",
                (el) => el.textContent.match(/\[(\d+)\]/)[1]
              ),
              10
            ) || 0;
        } catch (e) {
          // 댓글 수 가져오기 실패시 기본값 사용
        }

        const author = await item.$eval(".nick_btn .nickname", (el) =>
          el.textContent.trim()
        );

        let memberLevel = 0;
        try {
          const memberLevelText = await item.$eval(
            ".LevelIcon_LevelIcon__zegm_ .blind",
            (el) => el.textContent.replace("멤버등급 : ", "")
          );
          memberLevel = levelNames[memberLevelText] || 0;
        } catch (e) {
          // 멤버 레벨 가져오기 실패시 기본값 사용
        }

        const date = await item.$eval(".date", (el) => el.textContent.trim());

        let viewCount = 0;
        try {
          let viewCountText = await item.$eval(".count", (el) =>
            el.textContent.replace(/[^0-9만]/g, "")
          );
          viewCount = viewCountText.includes("만")
            ? parseFloat(viewCountText) * 10000
            : parseInt(viewCountText, 10) || 0;
        } catch (e) {
          // 조회수 가져오기 실패시 기본값 사용
        }

        items.push({
          href,
          thumbnail,
          title,
          commentCount,
          author,
          memberLevel,
          date,
          viewCount,
        });
      } catch (error) {
        console.error("아이템 개별 스크래핑 에러:", error.message);
        // 개별 아이템 실패 시 건너뛰고 계속 진행
      }
    }
  } catch (error) {
    console.error("스크래핑 루프 에러:", error.message);
  }

  return items;
}

export { fanArtRouter };
