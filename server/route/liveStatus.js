import express from "express";
import puppeteer from "puppeteer";
import pLimit from "p-limit";

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

const CONCURRENCY = 5; // 동시에 열 페이지 수 제한
const limit = pLimit(CONCURRENCY);

// delay 헬퍼
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// 재시도 로직이 포함된 goto
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

async function checkLive(streamer, browser) {
  const page = await browser.newPage();
  // 네비게이션 타임아웃 15초
  page.setDefaultNavigationTimeout(15000);

  // 헤더 설정 & 리소스 절약
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/113.0.0.0 Safari/537.36"
  );
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const resource = req.resourceType();
    if (["image", "stylesheet", "font"].includes(resource)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const url = `https://ch.sooplive.co.kr/${streamer.id}`;
  try {
    await gotoWithRetry(page, url, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    // 최소 요소 대기
    await page
      .waitForSelector(".onAir_box, .onair_box", { timeout: 5000 })
      .catch(() => {});
    const live = await page.evaluate(() =>
      Boolean(document.querySelector(".onAir_box, .onair_box"))
    );
    await page.close();
    return { ...streamer, live };
  } catch (err) {
    console.error(
      `❌ ${streamer.name} (${streamer.id}) 최종 실패:`,
      err.message
    );
    await page.close();
    return { ...streamer, live: false };
  }
}

async function checkAllLive() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const checks = streamers.map((s) => limit(() => checkLive(s, browser)));
  const results = await Promise.all(checks);

  await browser.close();
  return results;
}

router.get("/", async (req, res) => {
  try {
    const data = await checkAllLive();
    res.json(data);
  } catch (err) {
    console.error("❌ 라이브 상태 조회 실패:", err);
    res.status(500).json({ error: "라이브 상태 조회 중 오류가 발생했습니다." });
  }
});

export default router;
