import React, { useEffect, useState } from "react";
import "./IsedolVideo.css";
import VideoItem from "../VideoItem/VideoItem";

const YT_API_KEY = process.env.REACT_APP_YT_API_KEY;

function IsedolVideo({ channelId }) {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (!channelId || !YT_API_KEY) return;

    const fetchUploadsPlaylistId = async () => {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?` +
          `part=contentDetails&id=${channelId}&key=${YT_API_KEY}`
      );
      const data = await res.json();
      return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    };

    const fetchVideos = async () => {
      try {
        const uploadsId = await fetchUploadsPlaylistId();
        if (!uploadsId) return;

        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?` +
            `part=snippet&playlistId=${uploadsId}` +
            `&maxResults=50&key=${YT_API_KEY}`
        );
        const data = await res.json();

        const items = data.items
          .filter((item) => item.snippet)
          .map((item) => item.snippet);

        const filtered = items
          .filter((snip) => !snip.title.toLowerCase().includes("shorts"))
          .slice(0, 12); // 최대 12개

        setVideos(filtered);
      } catch (err) {
        console.error("영상 불러오기 실패:", err);
        setVideos([]);
      }
    };

    fetchVideos();
  }, [channelId]);

  return (
    <div className="video_container container last_section">
      <div>
        <div className="title">
          <h1>최근 올라온 영상</h1>
        </div>
        <div className="video_main">
          <div className="video_grid">
            {videos.map((snippet, idx) => (
              <VideoItem key={idx} video={{ snippet }} />
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="title">
          <h1>최근 올라온 클립</h1>
        </div>
        <div className="clip_main">zzz</div>
      </div>
    </div>
  );
}

export default IsedolVideo;
