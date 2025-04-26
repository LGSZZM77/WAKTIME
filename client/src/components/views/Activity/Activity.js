import React, { useEffect, useState } from "react";
import { Backpack, ChevronRight } from "lucide-react";
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

// 소플라이브 ID 추출 함수
function extractSoopId(soopUrl) {
  const parts = soopUrl.split("/");
  return parts[parts.length - 1];
}

export default function Activity() {
  const [videos, setVideos] = useState([]);
  const [liveMap, setLiveMap] = useState({});

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

  useEffect(() => {
    // 서버 API 경로 (기본값 또는 환경변수 사용)
    const apiUrl = process.env.REACT_APP_API_URL;

    fetch(`${apiUrl}/api/live-status`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API 요청 실패: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("받은 데이터:", data);
        // 데이터 형식 검사
        if (Array.isArray(data)) {
          // 서버로부터 받은 ID를 기반으로 매핑
          const idToLiveStatus = {};
          data.forEach((item) => {
            idToLiveStatus[item.id] = item.live;
          });

          // streamers 배열의 각 항목에 대해 live 상태 설정
          const newLiveMap = {};
          streamers.forEach((streamer) => {
            const soopId = extractSoopId(streamer.soop);
            newLiveMap[streamer.name] = idToLiveStatus[soopId] || false;
          });

          setLiveMap(newLiveMap);
        } else {
          console.error("예상하지 못한 데이터 형식:", data);
        }
      })
      .catch((err) => {
        console.error("뱅온 상태 로딩 실패:", err);
        // 오류 발생 시 빈 객체로 설정
        setLiveMap({});
      });
  }, []);

  return (
    <div className="activity last_section">
      <div className="activity_container container">
        {/* 비디오 섹션 */}
        <div className="video">
          <div className="title">
            <h1>
              최근 올라온 영상{" "}
              <span className="videos_length">[{videos.length}]</span>
            </h1>
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

        {/* live 섹션 */}
        <div className="live">
          <div className="live_wrap">
            <div className="live_top">
              <div className="soop_icon">
                <img src="/soop_color.svg" alt="soop_color" />
              </div>
              <h2>뱅온 정보</h2>
            </div>
            <div className="live_bottom">
              {streamers.map((streamer, i) => {
                const isLive = liveMap[streamer.name];
                return (
                  <a
                    href={isLive ? streamer.soopPlay : streamer.soop}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={i}
                  >
                    <div className="live_item">
                      <div className="live_profile">
                        <div className={`profile ${!isLive ? "filtered" : ""}`}>
                          <img src={streamer.imageUrl} alt={streamer.name} />
                        </div>
                        <p>{streamer.name}</p>
                      </div>
                      <div className="live_info">
                        {isLive ? (
                          <div className="on_air">
                            <span className="on_air_circle"></span>Live
                          </div>
                        ) : (
                          <div className="off_line">
                            <span className="off_line_circle"></span>오프라인
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
