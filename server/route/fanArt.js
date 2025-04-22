import express from "express";
import puppeteer from "puppeteer";

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

// 이미지 프록시 엔드포인트
fanArtRouter.get("/image-proxy", async (req, res) => {
  const imageUrlParam = req.query.url;
  if (typeof imageUrlParam !== "string") {
    return res.status(400).send("이미지 URL이 필요합니다");
  }

  const cleanUrl = imageUrlParam.split("?")[0];

  try {
    const response = await fetch(cleanUrl);
    if (!response.ok) {
      return res
        .status(response.status)
        .send("이미지를 가져오는데 실패했습니다");
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/*";

    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Content-Type", contentType);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("이미지 프록시 에러:", error);
    res.status(500).send("이미지를 가져오는데 실패했습니다");
  }
});

// 팬아트 데이터를 가져오는 함수
async function getFanArtData() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
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
