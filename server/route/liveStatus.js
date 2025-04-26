import express from "express";
import pLimit from "p-limit";
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

const CONCURRENCY = 2;
const limit = pLimit(CONCURRENCY);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

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

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/113.0.0.0 Safari/537.36"
  );
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "stylesheet", "font"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const url = `https://ch.sooplive.co.kr/${streamer.id}`;
  try {
    await gotoWithRetry(page, url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
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
    return { ...streamer, live: null };
  }
}

async function checkAllLive() {
  const browser = await getBrowser();
  try {
    const checks = streamers.map((s) => limit(() => checkLive(browser, s)));
    const results = await Promise.all(checks);
    return results;
  } finally {
    await browser.close();
  }
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
