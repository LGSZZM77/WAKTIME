import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import "./VideoItem.css";

function VideoItem({ video }) {
  const { title, thumbnails, publishedAt } = video.snippet;

  return (
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
  );
}

export default VideoItem;
