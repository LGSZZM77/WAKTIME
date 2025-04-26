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

// fanArtRouter.get("/image-proxy") 부분 수정
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
    // 타임아웃 설정 추가
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok)
      return res
        .status(response.status)
        .send("이미지를 가져오는데 실패했습니다");

    const buffer = await response.arrayBuffer();
    let image = sharp(Buffer.from(buffer));

    // 이미지 처리 최적화: 먼저 크기를 줄여서 메모리 사용량 감소
    if (width || height) {
      image = image.resize({
        width: width || undefined,
        height: height || undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    } else {
      // 너무 큰 이미지는 기본적으로 크기 제한
      image = image.resize({
        width: 1200,
        height: 1200,
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
    // 에러 응답에 기본 이미지 제공
    res.status(500).send("이미지를 처리하는데 실패했습니다");
  }
});

// thumbnail 엔드포인트에도 동일한 변경 적용
fanArtRouter.get("/thumbnail", async (req, res) => {
  const url = req.query.url;
  if (typeof url !== "string")
    return res.status(400).send("이미지 URL이 필요합니다");
  const width = req.query.width ? parseInt(req.query.width) : 300;
  const height = req.query.height ? parseInt(req.query.height) : null;
  const quality = req.query.quality ? parseInt(req.query.quality) : 70;
  const clean = url.split("?")[0];

  try {
    // 타임아웃 설정 추가
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

    const response = await fetch(clean, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeoutId);

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

// getFanArtData 함수 수정 - 메모리 사용량 줄이기
async function getFanArtData() {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 메모리 사용량 최적화
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );

    // 이미지, 스타일시트, 폰트 모두 차단
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        req.resourceType() === "stylesheet" ||
        req.resourceType() === "font" ||
        req.resourceType() === "image" ||
        req.resourceType() === "media"
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
      waitUntil: "domcontentloaded", // 더 빠른 로딩 옵션 사용
      timeout: 30000, // 타임아웃 단축
    });

    await page.waitForTimeout(2000);

    // 페이지 로드 후 대기
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 필요한 선택자가 로드될 때까지 기다림
    try {
      await page.waitForSelector(".article-album-view .item", {
        timeout: 10000,
      });
    } catch (e) {
      console.log("아이템 선택자를 찾을 수 없습니다:", e.message);
    }

    // 메모리 사용량을 위해 최대 아이템 수 제한
    const MAX_ITEMS = 15; // 최대 15개 아이템만 처리
    const items = await scrapeAlbumItems(page, MAX_ITEMS);
    console.log(`✅ 팬아트 ${items.length}개 수집 완료`);
    return items;
  } catch (err) {
    console.error("❌ 팬아트 스크래핑 실패:", err.message);
    return []; // 실패해도 서버가 죽지 않게 빈 배열 반환
  } finally {
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

// 최대 아이템 수 제한을 위한 매개변수 추가
async function scrapeAlbumItems(page, maxItems = Infinity) {
  try {
    const nodes = await page.$$(".article-album-view .item");
    console.log(`찾은 아이템 수: ${nodes.length}`);

    const levelNames = {
      아메바: 0,
      진드기: 1,
      닭둘기: 2,
      왁무새: 3,
      침팬치: 4,
      느그자: 5,
    };

    const items = [];

    // 최대 아이템 수 제한
    const nodesToProcess = nodes.slice(0, maxItems);

    for (const item of nodesToProcess) {
      try {
        // (나머지 코드는 동일)
        // href 가져오기
        let href = "#";
        try {
          href = await page.evaluate(
            (el) => el.querySelector("a.thumbLink").href,
            item
          );
        } catch (e) {
          console.log("href 가져오기 실패");
        }

        // 이미지 처리
        let thumbnail = "";
        try {
          thumbnail = await page.evaluate((el) => {
            const source = el.querySelector("picture.DefaultImage source");
            if (source && source.getAttribute("srcset")) {
              return source.getAttribute("srcset").split(" ")[0].split("?")[0];
            }

            // 대체 이미지 선택자 시도
            const img = el.querySelector("img.thumb, a.thumbLink img");
            if (img) {
              return img.src || img.getAttribute("data-src") || "";
            }

            return "";
          }, item);
        } catch (e) {
          thumbnail = "/default-thumbnail.jpg";
        }

        // 제목 가져오기
        let title = "제목 없음";
        try {
          title = await page.evaluate((el) => {
            const titleEl = el.querySelector(".tit_txt");
            return titleEl ? titleEl.textContent.trim() : "제목 없음";
          }, item);
        } catch (e) {}

        // 댓글 수 가져오기
        let commentCount = 0;
        try {
          commentCount = await page.evaluate((el) => {
            const commentEl = el.querySelector("a.comment");
            if (commentEl) {
              const match = commentEl.textContent.match(/\[(\d+)\]/);
              return match ? parseInt(match[1], 10) : 0;
            }
            return 0;
          }, item);
        } catch (e) {}

        // 작성자 가져오기
        let author = "불명";
        try {
          author = await page.evaluate((el) => {
            const authorEl = el.querySelector(".nick_btn .nickname");
            return authorEl ? authorEl.textContent.trim() : "불명";
          }, item);
        } catch (e) {}

        // 멤버 레벨 가져오기
        let memberLevel = 0;
        try {
          memberLevel = await page.evaluate((el) => {
            const levelEl = el.querySelector(
              ".LevelIcon_LevelIcon__zegm_ .blind"
            );
            if (levelEl) {
              const levelText = levelEl.textContent.replace("멤버등급 : ", "");
              const levels = {
                아메바: 0,
                진드기: 1,
                닭둘기: 2,
                왁무새: 3,
                침팬치: 4,
                느그자: 5,
              };
              return levels[levelText] || 0;
            }
            return 0;
          }, item);
        } catch (e) {}

        // 날짜 가져오기
        let date = "불명";
        try {
          date = await page.evaluate((el) => {
            const dateEl = el.querySelector(".date");
            return dateEl ? dateEl.textContent.trim() : "불명";
          }, item);
        } catch (e) {}

        // 조회수 가져오기
        let viewCount = 0;
        try {
          viewCount = await page.evaluate((el) => {
            const countEl = el.querySelector(".count");
            if (countEl) {
              const countText = countEl.textContent.replace(/[^0-9만]/g, "");
              return countText.includes("만")
                ? parseFloat(countText) * 10000
                : parseInt(countText, 10) || 0;
            }
            return 0;
          }, item);
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
  } catch (error) {
    console.error("스크래핑 전체 오류:", error.message);
    return [];
  }
}

export { fanArtRouter };
