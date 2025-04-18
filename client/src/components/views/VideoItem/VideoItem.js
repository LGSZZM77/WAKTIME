import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import "./VideoItem.css";

function VideoItem({ video }) {
  if (!video || !video.snippet) {
    return (
      <div className="video_item">
        <div className="thumbnail"></div>
        <div className="owner">
          <div className="upload_info">
            <p className="upload_title">loading ..</p>
            <p className="upload_time">loading ..</p>
          </div>
        </div>
      </div>
    );
  }

  const { title, thumbnails, publishedAt, resourceId } = video.snippet;
  const videoUrl = `https://www.youtube.com/watch?v=${resourceId.videoId}`;

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="video_item_link"
    >
      <div className="video_item">
        <img src={thumbnails.medium.url} alt={title} className="thumbnail" />
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
