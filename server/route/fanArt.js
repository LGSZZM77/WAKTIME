import express from "express";
import puppeteer from "puppeteer";
import sharp from "sharp"; // 이미지 처리를 위한 라이브러리 추가

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

  // 캐시 업데이트
  cachedData = data;
  lastFetchTime = currentTime;

  // HTTP 캐시 헤더 설정
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(data);
});

// 이미지 프록시 엔드포인트 (개선됨)
fanArtRouter.get("/image-proxy", async (req, res) => {
  const imageUrlParam = req.query.url;
  if (typeof imageUrlParam !== "string") {
    return res.status(400).send("이미지 URL이 필요합니다");
  }

  // 이미지 최적화 관련 파라미터
  const format = req.query.format || "auto"; // auto, webp, jpeg, png
  const width = req.query.width ? parseInt(req.query.width) : null;
  const height = req.query.height ? parseInt(req.query.height) : null;
  const quality = req.query.quality ? parseInt(req.query.quality) : 80; // 기본 품질 80%

  const cleanUrl = imageUrlParam.split("?")[0];

  try {
    const response = await fetch(cleanUrl);
    if (!response.ok) {
      return res
        .status(response.status)
        .send("이미지를 가져오는데 실패했습니다");
    }

    const buffer = await response.arrayBuffer();
    const userAgent = req.headers["user-agent"] || "";

    // sharp를 사용해 이미지 처리 시작
    let image = sharp(Buffer.from(buffer));

    // 크기 조정이 요청된 경우
    if (width || height) {
      image = image.resize({
        width: width || undefined,
        height: height || undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // 포맷 변환 및 최적화
    let outputFormat = format;
    if (format === "auto") {
      // User-Agent를 사용해 WebP 지원 여부 확인
      const supportsWebP =
        userAgent.includes("Chrome") ||
        userAgent.includes("Edge") ||
        userAgent.includes("Opera") ||
        (userAgent.includes("Firefox") && userAgent.includes("Mobile"));

      outputFormat = supportsWebP ? "webp" : "jpeg";
    }

    // 포맷에 따른 적절한 설정으로 변환
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
      case "avif":
        outputBuffer = await image.avif({ quality }).toBuffer();
        res.setHeader("Content-Type", "image/avif");
        break;
      case "jpeg":
      default:
        outputBuffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
        res.setHeader("Content-Type", "image/jpeg");
    }

    // 캐시 헤더 설정 (1일)
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(outputBuffer);
  } catch (error) {
    console.error("이미지 프록시 에러:", error);
    res.status(500).send("이미지를 처리하는데 실패했습니다");
  }
});

// 썸네일 생성 전용 엔드포인트 추가
fanArtRouter.get("/thumbnail", async (req, res) => {
  const imageUrlParam = req.query.url;
  if (typeof imageUrlParam !== "string") {
    return res.status(400).send("이미지 URL이 필요합니다");
  }

  const width = req.query.width ? parseInt(req.query.width) : 300;
  const height = req.query.height ? parseInt(req.query.height) : null;
  const quality = req.query.quality ? parseInt(req.query.quality) : 70;

  const cleanUrl = imageUrlParam.split("?")[0];

  try {
    const response = await fetch(cleanUrl);
    if (!response.ok) {
      return res
        .status(response.status)
        .send("이미지를 가져오는데 실패했습니다");
    }

    const buffer = await response.arrayBuffer();

    // 썸네일 생성 (기본적으로 WebP로 변환)
    const thumbnail = await sharp(Buffer.from(buffer))
      .resize({
        width,
        height: height || undefined,
        fit: "cover",
        position: "entropy", // 중요 부분 자동 감지
      })
      .webp({ quality })
      .toBuffer();

    res.setHeader("Cache-Control", "public, max-age=86400"); // 1일 캐시
    res.setHeader("Content-Type", "image/webp");
    res.send(thumbnail);
  } catch (error) {
    console.error("썸네일 생성 에러:", error);
    res.status(500).send("이미지를 처리하는데 실패했습니다");
  }
});

// 팬아트 데이터를 가져오는 함수
async function getFanArtData() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
    executablePath: puppeteer.executablePath(),
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/113.0.0.0 Safari/537.36"
  );

  try {
    const targetUrl =
      "https://cafe.naver.com/f-e/cafes/27842958/menus/551?viewType=I&page=1";
    await page.goto(targetUrl, { waitUntil: "networkidle2" });

    const items = await scrapeAlbumItems(page);
    return items;
  } catch (err) {
    console.error("팬아트 스크래핑 오류:", err.message);
    return [];
  } finally {
    await browser.close();
  }
}

const levelNames = {
  아메바: 0,
  진드기: 1,
  닭둘기: 2,
  왁무새: 3,
  침팬치: 4,
  느그자: 5,
};

async function scrapeAlbumItems(page) {
  const nodes = await page.$$(".article-album-view .item"); // 모든 아이템 노드 선택

  const formatNumber = (number) => {
    if (number >= 10000) {
      return (number / 10000).toFixed(1) + "만";
    } else if (number >= 1000) {
      return number.toLocaleString();
    } else {
      return number.toString();
    }
  };

  const items = [];

  for (const item of nodes) {
    const link = await item.$("a.thumbLink");
    const href = link ? await link.evaluate((el) => el.href) : null;

    const srcsetValue = await item.$eval("picture.DefaultImage source", (el) =>
      el.getAttribute("srcset")
    );
    const rawUrl = srcsetValue ? srcsetValue.split(" ")[0] : null;
    const thumbnail = rawUrl ? rawUrl.split("?")[0] : null;

    const titleElement = await item.$(".tit_txt");
    const title = titleElement
      ? await titleElement.evaluate((el) => el.textContent.trim())
      : null;

    const commentElement = await item.$("a.comment");
    let commentCount = 0;
    if (commentElement) {
      const commentText = await commentElement.evaluate((el) =>
        el.textContent.trim()
      );
      const commentMatch = commentText.match(/\[(\d+)\]/);
      if (commentMatch) {
        commentCount = parseInt(commentMatch[1], 10);
      }
    }

    const nicknameElement = await item.$(".nick_btn .nickname");
    const author = nicknameElement
      ? await nicknameElement.evaluate((el) => el.textContent.trim())
      : null;

    const levelIcon = await item.$(".LevelIcon_LevelIcon__zegm_");
    const memberLevelText = levelIcon
      ? await levelIcon.$eval(".blind", (el) => el.textContent.trim())
      : null;

    const levelName = memberLevelText
      ? memberLevelText.replace("멤버등급 : ", "").trim()
      : null;

    const memberLevel =
      levelNames[levelName] !== undefined ? levelNames[levelName] : "";

    const dateElement = await item.$(".date");
    const date = dateElement
      ? await dateElement.evaluate((el) => el.textContent.trim())
      : null;

    let viewCountText = await item.$eval(".count", (el) =>
      el.textContent.trim()
    );

    viewCountText = viewCountText.replace("조회 ", "").replace(/,/g, "");

    if (viewCountText.includes("만")) {
      viewCountText = viewCountText.replace("만", "") * 10000; // 예: '1만' -> 10000
    }

    const viewCount = parseInt(viewCountText, 10) || 0;

    items.push({
      href,
      thumbnail,
      title,
      commentCount,
      author,
      memberLevel,
      date,
      viewCount: formatNumber(viewCount),
    });
  }

  return items;
}

export { fanArtRouter };
