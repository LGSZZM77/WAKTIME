import React from "react";
import { ChevronRight } from "lucide-react";
import { streamers } from "../../../data/streamers";
import "./Activity.css";

function Activity() {
  return (
    <div className="activity">
      <div className="activity_container container">
        <div className="video">
          <div className="video_title">
            <h1>최근 올라온 영상</h1>
          </div>
          <div className="video_wrap">
            {streamers.map((streamer, index) => {
              return (
                <div className="video_item" key={index}>
                  <div className="thumbnail"></div>
                  <div className="owner">
                    <div className="profile"></div>
                    <div className="upload_info">
                      <p className="upload_title">{streamer.name}</p>
                      <p className="upload_time">1시간 전</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <a
            className="video_link"
            href="https://www.youtube.com/@waktaverse"
            target="_blank"
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
