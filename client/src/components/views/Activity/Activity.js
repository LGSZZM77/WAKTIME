import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import VideoItem from "../VideoItem/VideoItem";
import "./Activity.css";
import { streamers } from "../../../data/streamers";

const YT_API_KEY = process.env.REACT_APP_YT_API_KEY;
const WAKTAVERSE_ID = "UCzh4yY8rl38knH33XpNqXbQ";

// ISO8601 duration → 초 단위 변환
function isoToSeconds(iso) {
  const m = +(iso.match(/(\d+)M/)?.[1] || 0);
  const s = +(iso.match(/(\d+)S/)?.[1] || 0);
  return m * 60 + s;
}

export default function Activity() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const cacheKey = "videos_activity";
    const cacheTimeKey = `${cacheKey}_time`;

    // 캐시 유효성 검사 (30분)
    const raw = localStorage.getItem(cacheKey);
    const time = localStorage.getItem(cacheTimeKey);
    if (raw && time && Date.now() - new Date(time) < 30 * 60 * 1000) {
      setVideos(JSON.parse(raw));
      return;
    }

    // 1) search.list 로 최대 16개 snippet + id
    fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}` +
        `&channelId=${WAKTAVERSE_ID}` +
        `&part=snippet,id&order=date&maxResults=16`
    )
      .then((r) => r.json())
      .then(async (sd) => {
        if (!sd.items) throw new Error("No search results");

        const items = sd.items
          .filter((i) => i.id.kind === "youtube#video")
          .map((i) => ({ videoId: i.id.videoId, snippet: i.snippet }));

        // 2) videos.list 로 duration 조회
        const ids = items.map((i) => i.videoId).join(",");
        const vr = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?key=${YT_API_KEY}` +
            `&part=contentDetails&id=${ids}`
        );
        const vd = await vr.json();

        const durationMap = {};
        vd.items.forEach((v) => {
          durationMap[v.id] = v.contentDetails.duration;
        });

        // 3) 3분 이하 쇼츠(≤180초) 제외, 12개만
        const filtered = items
          .filter((i) => isoToSeconds(durationMap[i.videoId] || "") > 180)
          .slice(0, 12);

        setVideos(filtered);
        localStorage.setItem(cacheKey, JSON.stringify(filtered));
        localStorage.setItem(cacheTimeKey, new Date().toISOString());
      })
      .catch((err) => console.error("영상 불러오기 실패:", err));
  }, []);

  return (
    <div className="activity last_section">
      <div className="activity_container container">
        {/* 비디오 섹션 */}
        <div className="video">
          <div className="title">
            <h1>최근 올라온 영상</h1>
          </div>
          <div className="video_wrap">
            {videos.map((v, idx) => (
              <VideoItem
                key={idx}
                video={{
                  id: { videoId: v.videoId },
                  snippet: v.snippet,
                }}
              />
            ))}
          </div>
          <a
            className="video_link"
            href="https://www.youtube.com/@waktaverse"
            target="_blank"
            rel="noopener noreferrer"
          >
            왁타버스 채널 바로가기 <ChevronRight />
          </a>
        </div>

        {/* live 섹션 (원래 CSS 마크업 유지) */}
        <div className="live">
          <div className="live_wrap">
            <div className="live_top">
              <div className="soop_icon">
                <img src="/soop_color.svg" alt="soop_color" />
              </div>
              <h2>뱅온 정보</h2>
            </div>
            <div className="live_bottom">
              {streamers.map((streamer, i) => (
                <a
                  href={streamer.soop}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={i}
                >
                  <div className="live_item">
                    <div className="live_profile">
                      <div className="profile">
                        <img src={streamer.imageUrl} alt={streamer.name} />
                      </div>
                      <p>{streamer.name}</p>
                    </div>
                    <div className="live_info">
                      <div className="off_line">오프라인</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
