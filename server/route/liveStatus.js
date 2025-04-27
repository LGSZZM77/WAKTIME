import express from "express";
import pLimit from "p-limit";
import puppeteer from "puppeteer";

async function getBrowser() {
  return puppeteer.launch({
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
  });
}

const router = express.Router();

const streamers = [
  { name: "우왁굳", id: "ecvhao" },
  { name: "아이네", id: "inehine" },
  { name: "징버거", id: "jingburger1" },
  { name: "릴파", id: "lilpa0309" },
  { name: "주르르", id: "cotton1217" },
  { name: "고세구", id: "gosegu2" },
  { name: "비챤", id: "viichan6" },
];

// 동시 요청 수를 1로 줄여 리소스 부하 감소
const CONCURRENCY = 1;
const limit = pLimit(CONCURRENCY);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// 캐싱 추가
let cachedLiveData = null;
let lastFetchTime = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2분 캐시

async function gotoWithRetry(page, url, options, retries = 2) {
  try {
    return await page.goto(url, options);
  } catch (err) {
    if (retries > 0) {
      console.warn(
        `⚠️ ${url} 네비게이트 실패, 재시도: ${retries}회 남음`,
        err.message
      );
      await delay(1000);
      return gotoWithRetry(page, url, options, retries - 1);
    }
    throw err;
  }
}

async function checkLive(browser, streamer) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(15000);

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/113.0.0.0 Safari/537.36"
    );
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      // CSS와 이미지, 폰트, 미디어 모두 차단하여 더 빠른 로딩
      if (["image", "stylesheet", "font", "media", "script"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const url = `https://ch.sooplive.co.kr/${streamer.id}`;
    try {
      console.log(`🔍 ${streamer.name} 라이브 확인 시작...`);

      await gotoWithRetry(page, url, {
        waitUntil: "domcontentloaded", // 더 빠른 로드 조건 사용
        timeout: 10000, // 타임아웃 감소
      });

      // 더 짧은 타임아웃으로 라이브 요소 확인
      const liveElement = await page
        .waitForSelector(".onAir_box, .onair_box", { timeout: 3000 })
        .catch(() => null);

      const live = Boolean(liveElement);
      console.log(`✅ ${streamer.name}: ${live ? "라이브 중" : "오프라인"}`);

      return { ...streamer, live };
    } catch (err) {
      console.error(
        `❌ ${streamer.name} (${streamer.id}) 최종 실패:`,
        err.message
      );
      return { ...streamer, live: null };
    }
  } catch (err) {
    console.error(`⚠️ ${streamer.name} 페이지 설정 중 오류:`, err.message);
    return { ...streamer, live: null };
  } finally {
    // 메모리 해제를 위해 페이지 닫기
    try {
      await page.close();
    } catch (e) {
      console.error("페이지 닫기 실패:", e.message);
    }
  }
}

async function checkAllLive() {
  const browser = await getBrowser();
  try {
    const checks = streamers.map((s) => limit(() => checkLive(browser, s)));
    const results = await Promise.all(checks);
    return results;
  } catch (err) {
    console.error("❌ 전체 라이브 확인 중 오류:", err.message);
    return streamers.map((s) => ({ ...s, live: null }));
  } finally {
    try {
      await browser.close();
    } catch (e) {
      console.error("브라우저 닫기 실패:", e.message);
    }
  }
}

router.get("/", async (req, res) => {
  const currentTime = Date.now();

  // 캐시된 데이터가 있고 유효하면 재사용
  if (
    cachedLiveData &&
    lastFetchTime &&
    currentTime - lastFetchTime < CACHE_DURATION
  ) {
    console.log("📋 캐시된 라이브 상태 정보 반환");
    return res.json(cachedLiveData);
  }

  try {
    console.log("🔄 라이브 상태 새로 확인 중...");
    const data = await checkAllLive();

    // 캐시 업데이트
    cachedLiveData = data;
    lastFetchTime = currentTime;

    res.setHeader("Cache-Control", "public, max-age=120"); // 2분 캐시
    res.json(data);
  } catch (err) {
    console.error("❌ 라이브 상태 조회 실패:", err);
    res.status(500).json({ error: "라이브 상태 조회 중 오류가 발생했습니다." });
  }
});

export default router;
