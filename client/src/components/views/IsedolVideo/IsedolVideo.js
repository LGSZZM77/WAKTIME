import React, { useEffect, useState } from "react";
import "./IsedolVideo.css";
import VideoItem from "../VideoItem/VideoItem";

const YT_API_KEY = process.env.REACT_APP_YT_API_KEY;

function IsedolVideo({ channelId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1) 채널의 업로드 플레이리스트 ID 구하기
  const fetchUploadsPlaylistId = async (id) => {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?` +
        `part=contentDetails&id=${id}&key=${YT_API_KEY}`
    );
    const data = await res.json();
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  };

  // ISO8601 기간을 초 단위로 변환
  const isoToSeconds = (iso) => {
    const m = (iso.match(/(\d+)M/) || [])[1] ?? 0;
    const s = (iso.match(/(\d+)S/) || [])[1] ?? 0;
    return parseInt(m, 10) * 60 + parseInt(s, 10);
  };

  const fetchVideos = async (id) => {
    if (!id || !YT_API_KEY) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // A) 30개 snippet(resourceId.videoId) 가져오기
      const uploads = await fetchUploadsPlaylistId(id);
      const pRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?` +
          `part=snippet&playlistId=${uploads}&maxResults=30&key=${YT_API_KEY}`
      );
      const pData = await pRes.json();
      if (!pData.items) throw new Error("No playlist items");

      const items = pData.items.map((it) => ({
        videoId: it.snippet.resourceId.videoId,
        snippet: it.snippet,
      }));

      // B) videos.list로 duration(contentDetails) 가져오기
      const ids = items.map((i) => i.videoId).join(",");
      const vRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?` +
          `part=contentDetails&id=${ids}&key=${YT_API_KEY}`
      );
      const vData = await vRes.json();
      const durMap = {};
      vData.items.forEach((v) => {
        durMap[v.id] = v.contentDetails.duration;
      });

      // C) 3분(180초) 초과만 남기고 12개로 자르기
      const filtered = items
        .filter((i) => isoToSeconds(durMap[i.videoId] || "") > 180)
        .slice(0, 12);

      // 캐시 & 상태 업데이트
      const cacheKey = `videos_isedol_${id}`;
      localStorage.setItem(cacheKey, JSON.stringify(filtered));
      localStorage.setItem(`${cacheKey}_time`, new Date().toISOString());
      setVideos(filtered);
    } catch (err) {
      console.error("영상 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cacheKey = `videos_isedol_${channelId}`;
    const cache = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    const expired =
      cacheTime && new Date() - new Date(cacheTime) > 30 * 60 * 1000;

    if (cache && !expired) {
      setVideos(JSON.parse(cache));
      setLoading(false);
    } else {
      fetchVideos(channelId);
    }
  }, [channelId]);

  return (
    <div className="video_container container last_section">
      <div>
        <h1 className="title">최근 올라온 영상</h1>
        <div className="video_main">
          <div className="video_grid">
            {loading
              ? Array(12)
                  .fill()
                  .map((_, i) => <VideoItem key={i} video={null} />)
              : videos.map((v, i) => <VideoItem key={i} video={v} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IsedolVideo;
