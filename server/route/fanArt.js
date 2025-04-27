import express from "express";
import sharp from "sharp";
import puppeteer from "puppeteer";

async function getBrowser() {
  return puppeteer.launch({
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
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
    if (width || height) {
      image = image.resize({
        width: width || undefined,
        height: height || undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    } else {
      image = image.resize({
        width: 600,
        height: 600,
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
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

async function getFanArtData() {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );

    // CSS·font만 차단
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

    // JS 렌더링 후 충분히 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await page.waitForSelector(".article-album-view .item", {
        timeout: 10000,
      });
    } catch (e) {
      console.log("아이템 선택자를 찾을 수 없습니다:", e.message);
    }

    const MAX_ITEMS = 15;
    const items = await scrapeAlbumItems(page, MAX_ITEMS);
    console.log(`✅ 팬아트 ${items.length}개 수집 완료`);
    return items;
  } catch (err) {
    console.error("❌ 팬아트 스크래핑 실패:", err.message);
    return [];
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {}
    }
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}

async function scrapeAlbumItems(page, maxItems = Infinity) {
  try {
    const nodes = await page.$$(".article-album-view .item");
    console.log(`찾은 아이템 수: ${nodes.length}`);
    const items = [];
    for (const item of nodes.slice(0, maxItems)) {
      let href = "#",
        thumbnail = "",
        title = "제목 없음",
        commentCount = 0,
        author = "불명",
        memberLevel = 0,
        date = "불명",
        viewCount = 0;
      try {
        href = await page.evaluate(
          (el) => el.querySelector("a.thumbLink")?.href || "#",
          item
        );
        thumbnail = await page.evaluate((el) => {
          const src =
            el
              .querySelector("picture.DefaultImage source")
              ?.getAttribute("srcset")
              ?.split(" ")[0] ||
            el.querySelector("img.thumb, a.thumbLink img")?.src ||
            "";
          return src.split("?")[0];
        }, item);
        title = await page.evaluate(
          (el) =>
            el.querySelector(".tit_txt")?.textContent.trim() || "제목 없음",
          item
        );
        commentCount = await page.evaluate((el) => {
          const m = el
            .querySelector("a.comment")
            ?.textContent.match(/\[(\d+)\]/);
          return m ? parseInt(m[1], 10) : 0;
        }, item);
        author = await page.evaluate(
          (el) =>
            el.querySelector(".nick_btn .nickname")?.textContent.trim() ||
            "불명",
          item
        );
        memberLevel = await page.evaluate((el) => {
          const txt = el
            .querySelector(".LevelIcon_LevelIcon__zegm_ .blind")
            ?.textContent.replace("멤버등급 : ", "");
          return (
            {
              아메바: 0,
              진드기: 1,
              닭둘기: 2,
              왁무새: 3,
              침팬치: 4,
              느그자: 5,
            }[txt] || 0
          );
        }, item);
        date = await page.evaluate(
          (el) => el.querySelector(".date")?.textContent.trim() || "불명",
          item
        );
        viewCount = await page.evaluate((el) => {
          const c = el
            .querySelector(".count")
            ?.textContent.replace(/[^0-9만]/g, "");
          return c?.includes("만")
            ? parseFloat(c) * 10000
            : parseInt(c, 10) || 0;
        }, item);
      } catch (e) {
        console.error("아이템 처리 중 오류:", e.message);
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
    }
    return items;
  } catch (error) {
    console.error("스크래핑 전체 오류:", error.message);
    return [];
  }
}

export { fanArtRouter };
