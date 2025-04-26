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
    ],
    headless: true,
    protocolTimeout: 120000,
    timeout: 120000,
  });
}

const fanArtRouter = express.Router();
let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30분 캐시

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

  res.setHeader("Cache-Control", "public, max-age=300");
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

    // 필요 없는 리소스 차단
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
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
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 페이지 로드 후 잠시 대기
    await page.waitForTimeout(2000);

    // 필요한 선택자가 로드될 때까지 기다림
    await page
      .waitForSelector(".article-album-view .item", { timeout: 30000 })
      .catch(() => console.log("아이템 선택자를 찾을 수 없습니다."));

    const items = await scrapeAlbumItems(page);
    console.log(`✅ 팬아트 ${items.length}개 수집 완료`);
    return items;
  } catch (err) {
    console.error("❌ 팬아트 스크래핑 실패:", err.message);
    return []; // 실패해도 서버가 죽지 않게 빈 배열 반환
  } finally {
    await browser.close();
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

  for (const item of nodes) {
    try {
      // href와 썸네일 가져오기 - 에러 처리 추가
      const href = await item
        .$eval("a.thumbLink", (el) => el.href)
        .catch(() => "#");

      // 이미지 처리 부분을 try-catch로 감싸서 개선
      let thumbnail = "";
      try {
        const raw = await item.$eval("picture.DefaultImage source", (el) =>
          el.getAttribute("srcset")
        );
        thumbnail = raw.split(" ")[0].split("?")[0];
      } catch (e) {
        // 원래 코드에서의 다른 이미지 선택자도 시도
        try {
          thumbnail = await item.$eval(
            "img.thumb, a.thumbLink img",
            (el) => el.src || el.getAttribute("data-src") || ""
          );
        } catch (imgErr) {
          thumbnail = "/default-thumbnail.jpg";
          console.log("이미지를 찾을 수 없습니다.");
        }
      }

      // 나머지 정보 처리 - 각각 try-catch로 안전하게 가져오기
      let title = "제목 없음";
      try {
        title = await item.$eval(".tit_txt", (el) => el.textContent.trim());
      } catch (e) {}

      let commentCount = 0;
      try {
        commentCount =
          parseInt(
            await item.$eval("a.comment", (el) => {
              const match = el.textContent.match(/\[(\d+)\]/);
              return match ? match[1] : "0";
            }),
            10
          ) || 0;
      } catch (e) {}

      let author = "불명";
      try {
        author = await item.$eval(".nick_btn .nickname", (el) =>
          el.textContent.trim()
        );
      } catch (e) {}

      let memberLevel = 0;
      try {
        const memberLevelText = await item.$eval(
          ".LevelIcon_LevelIcon__zegm_ .blind",
          (el) => el.textContent.replace("멤버등급 : ", "")
        );
        memberLevel = levelNames[memberLevelText] || 0;
      } catch (e) {}

      let date = "불명";
      try {
        date = await item.$eval(".date", (el) => el.textContent.trim());
      } catch (e) {}

      let viewCount = 0;
      try {
        let viewCountText = await item.$eval(".count", (el) =>
          el.textContent.replace(/[^0-9만]/g, "")
        );
        viewCount = viewCountText.includes("만")
          ? parseFloat(viewCountText) * 10000
          : parseInt(viewCountText, 10) || 0;
      } catch (e) {}

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
      console.error("아이템 처리 중 오류:", error.message);
    }
  }
  return items;
}

export { fanArtRouter };
