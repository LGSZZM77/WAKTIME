import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());

const streamers = [
  { name: "우왁굳", id: "ecvhao" },
  { name: "아이네", id: "inehine" },
  { name: "징버거", id: "jingburger1" },
  { name: "릴파", id: "lilpa0309" },
  { name: "주르르", id: "cotton1217" },
  { name: "고세구", id: "gosegu2" },
  { name: "비챤", id: "viichan6" },
];

// ⏱️ page.waitForTimeout 대체 함수
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkAllLive() {
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

  const results = [];
  for (const { name, id } of streamers) {
    const url = `https://ch.sooplive.co.kr/${id}`;

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 10000 });

      // waitForTimeout 대체
      await delay(2000);

      const live = await page.evaluate(() => {
        return !!(
          document.querySelector(".onAir_box") ||
          document.querySelector(".onair_box")
        );
      });

      results.push({ name, id, live });
    } catch (err) {
      console.error(`❌ ${name} (${id}) check failed:`, err.message);
      results.push({ name, id, live: false });
    }
  }

  await browser.close();
  return results;
}

app.get("/api/live-status", async (req, res) => {
  const data = await checkAllLive();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
