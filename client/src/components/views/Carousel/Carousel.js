import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import "./Carousel.css";

function Carousel() {
  const cafe = "https://cafe.naver.com/steamindiegame";
  const API_KEY = process.env.REACT_APP_YT_API_KEY;

  // 스트리머 초기 정보에 bannerUrl 빈 문자열 추가
  const [streamers, setStreamers] = useState([
    {
      name: "우왁굳",
      youtubeUrl: "https://www.youtube.com/@woowakgood",
      soopUrl: "https://ch.sooplive.co.kr/ecvhao",
      bannerUrl: "",
    },
    {
      name: "아이네",
      youtubeUrl: "https://www.youtube.com/@INE_",
      soopUrl: "https://ch.sooplive.co.kr/inehine",
      bannerUrl: "",
    },
    {
      name: "징버거",
      youtubeUrl: "https://www.youtube.com/@jingburger",
      soopUrl: "https://ch.sooplive.co.kr/jingburger1",
      bannerUrl: "",
    },
    {
      name: "릴파",
      youtubeUrl: "https://www.youtube.com/@lilpa",
      soopUrl: "https://ch.sooplive.co.kr/lilpa0309",
      bannerUrl: "",
    },
    {
      name: "주르르",
      youtubeUrl: "https://www.youtube.com/@JU_RURU",
      soopUrl: "https://ch.sooplive.co.kr/cotton1217",
      bannerUrl: "",
    },
    {
      name: "고세구",
      youtubeUrl: "https://www.youtube.com/@gosegu",
      soopUrl: "https://ch.sooplive.co.kr/gosegu2",
      bannerUrl: "",
    },
    {
      name: "비챤",
      youtubeUrl: "https://www.youtube.com/@viichan116",
      soopUrl: "https://ch.sooplive.co.kr/viichan6",
      bannerUrl: "",
    },
  ]);

  // 컴포넌트가 마운트되면 유튜브 API로 배너 이미지를 가져와서 각 객체에 채워넣음
  useEffect(() => {
    const fetchBannerImages = async () => {
      const updatedStreamers = await Promise.all(
        streamers.map(async (streamer) => {
          let bannerUrl = "";
          try {
            // 채널 핸들은 youtubeUrl의 "@" 뒤의 텍스트로 추출 (예, "woowakgood")
            const handle = streamer.youtubeUrl.split("@")[1];
            const res = await axios.get(
              "https://www.googleapis.com/youtube/v3/channels",
              {
                params: {
                  part: "brandingSettings",
                  forHandle: handle,
                  key: API_KEY,
                },
              }
            );

            if (res.data.items && res.data.items.length > 0) {
              bannerUrl =
                res.data.items[0].brandingSettings?.image?.bannerExternalUrl ||
                "";
            }
          } catch (error) {
            console.error(`Error fetching banner for ${streamer.name}:`, error);
          }
          return { ...streamer, bannerUrl };
        })
      );
      setStreamers(updatedStreamers);
    };

    fetchBannerImages();
  }, []);

  // 캐러셀 슬라이드 복제 관련 처리
  const visibleCount = 3;
  const leftClones = streamers.slice(-visibleCount);
  const rightClones = streamers.slice(0, visibleCount);
  const slides = [...leftClones, ...streamers, ...rightClones];
  const [currentIndex, setCurrentIndex] = useState(visibleCount);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const bannerWrapRef = useRef(null);

  const getWidth = () => {
    const banner = bannerWrapRef.current.querySelector(".banner");
    return banner.getBoundingClientRect().width + 16; // 16은 margin 등 간격 값
  };

  useEffect(() => {
    const slideWidth = getWidth();
    const wrapper = bannerWrapRef.current;
    wrapper.style.transition = transitionEnabled
      ? "transform 0.3s ease"
      : "none";
    wrapper.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
  }, [currentIndex, transitionEnabled, streamers]);

  useEffect(() => {
    const wrapper = bannerWrapRef.current;
    const handleTransitionEnd = () => {
      if (currentIndex < visibleCount) {
        setTransitionEnabled(false);
        setCurrentIndex(currentIndex + streamers.length);
      } else if (currentIndex >= visibleCount + streamers.length) {
        setTransitionEnabled(false);
        setCurrentIndex(currentIndex - streamers.length);
      }
    };
    wrapper.addEventListener("transitionend", handleTransitionEnd);
    return () =>
      wrapper.removeEventListener("transitionend", handleTransitionEnd);
  }, [currentIndex, visibleCount, streamers.length]);

  const handleNext = () => {
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev - 1);
  };

  return (
    <div className="carousel">
      <div className="carousel_container">
        <div className="ov_hidden">
          <div className="banner_wrap" ref={bannerWrapRef}>
            {slides.map((streamer, i) => (
              <div
                className="banner"
                key={i}
                style={{
                  backgroundImage: streamer.bannerUrl
                    ? `url(${streamer.bannerUrl})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="benner_title fb">{streamer.name}</div>
                <div className="benner_link">
                  <a
                    href={streamer.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src="/youtube.svg" alt="youtube" />
                  </a>
                  <a href={cafe} target="_blank" rel="noopener noreferrer">
                    <img src="/cafe.svg" alt="cafe" />
                  </a>
                  <a
                    href={streamer.soopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src="/soop.svg" alt="soop" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="carousel_nav_btn">
          <button onClick={handlePrev}>
            <ChevronLeft />
          </button>
          <button onClick={handleNext}>
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Carousel;
