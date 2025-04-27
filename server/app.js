import express from "express";
import cors from "cors";
import liveRouter from "./route/liveStatus.js";
import { fanArtRouter } from "./route/fanArt.js";

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// 라이브 상태 API
app.use("/api/live-status", liveRouter);

// 팬아트(앨범) 스크래핑 API
app.use("/api/fanArt", fanArtRouter);

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${port}`);
});
