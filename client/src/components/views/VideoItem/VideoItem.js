import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import "./VideoItem.css";

function VideoItem({ video }) {
  // 로딩 상태 또는 없는 영상 처리
  if (!video || !video.snippet) {
    return (
      <div className="video_item">
        <div className="thumbnail skeleton"></div>
        <div className="owner">
          <div className="upload_info">
            <p className="upload_title skeleton">loading ..</p>
            <p className="upload_time skeleton">loading ..</p>
          </div>
        </div>
      </div>
    );
  }

  const { title, thumbnails, publishedAt } = video.snippet;

  // videoId를 더 명확하게 추출
  let videoId;

  if (video.id && typeof video.id === "object" && video.id.videoId) {
    // search API 응답 형식 (Activity.js)
    videoId = video.id.videoId;
  } else if (
    video.snippet &&
    video.snippet.resourceId &&
    video.snippet.resourceId.videoId
  ) {
    // playlistItems API 응답 형식 (IsedolVideo.js)
    videoId = video.snippet.resourceId.videoId;
  } else if (video.id && typeof video.id === "string") {
    // 단순 문자열 ID
    videoId = video.id;
  }

  // videoId가 없는 경우 처리
  if (!videoId) {
    console.warn("유효한 videoId 없음", video);
    return (
      <div className="video_item">
        <div className="thumbnail skeleton"></div>
        <div className="owner">
          <div className="upload_info">
            <p className="upload_title">유효한 videoId 없음</p>
            <p className="upload_time">-</p>
          </div>
        </div>
      </div>
    );
  }

  // 썸네일 URL 검사
  const thumbnailUrl =
    thumbnails && (thumbnails.medium?.url || thumbnails.default?.url || "");

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="video_item_link"
    >
      <div className="video_item">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="thumbnail" />
        ) : (
          <div className="thumbnail skeleton"></div>
        )}
        <div className="owner">
          <div className="upload_info">
            <p className="upload_title">{title}</p>
            <p className="upload_time">
              {formatDistanceToNow(new Date(publishedAt), {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>
        </div>
      </div>
    </a>
  );
}

export default VideoItem;
