import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import VideoItem from "../VideoItem/VideoItem";
import "./Activity.css";
import { streamers } from "../../../data/streamers";

const YT_API_KEY = process.env.REACT_APP_YT_API_KEY;
const WAKTAVERSE_ID = "UCzh4yY8rl38knH33XpNqXbQ";

function Activity() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!YT_API_KEY) return console.error("API key missing");
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
            `key=${YT_API_KEY}` +
            `&channelId=${WAKTAVERSE_ID}` +
            `&part=snippet,id` +
            `&order=date` +
            `&maxResults=20`
        );
        const data = await res.json();
        const items = data.items
          .filter((item) => item.id.kind === "youtube#video")
          .filter((item) => {
            const title = item.snippet.title.toLowerCase();
            return !title.includes("shorts");
          });
        setVideos(items);
      } catch (err) {
        console.error("영상 불러오기 실패:", err);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div className="activity last_section">
      <div className="activity_container container">
        <div className="video">
          <div className="title">
            <h1>최근 올라온 영상</h1>
          </div>
          <div className="video_wrap">
            {videos.map((video, idx) => (
              <VideoItem key={idx} video={video} />
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

        <div className="live">
          <div className="live_wrap">
            <div className="live_top">
              <div className="soop_icon">
                <img src="/soop_color.svg" alt="soop_color" />
              </div>
              <h2>뱅온 정보</h2>
            </div>
            <div className="live_bottom">
              {/* map 쓰기 */}
              {streamers.map((streamer, index) => {
                return (
                  <a href={streamer.soop} target="_blank">
                    <div className="live_item" key={index}>
                      <div className="live_profile">
                        <div className="profile"></div>
                        <p>{streamer.name}</p>
                      </div>
                      <div className="live_info">
                        <div className="off_line">오프라인</div>
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

export default Activity;
