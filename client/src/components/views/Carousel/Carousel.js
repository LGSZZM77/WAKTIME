import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { streamers } from "../../../data/streamers";
import "./Carousel.css";

function Carousel() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const slideGap = 16;

  useEffect(() => {
    setTimeout(() => {
      const existingClones = document.querySelectorAll(".banner.clone");
      if (existingClones.length > 0) return;

      const slides = document.querySelector(".banner_wrap");
      const slide = document.querySelectorAll(".banner");

      const slideWidth = slide[0].getBoundingClientRect().width;
      const slideCount = slide.length;
      makeClone(slides, slide, slideCount);
      updateWidth(slides, slideWidth);

      slides.classList.remove("animated");
      setInitialPos(slides, slideWidth, slideCount);
      slides.getBoundingClientRect();
      slides.classList.add("animated");
      setIsInitialized(true);
    }, 100);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const intervalId = setInterval(() => {
      handleNext();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isInitialized, currentIdx]);

  // 무한 반복 캐러셀 복사본 생성
  function makeClone(slides, slide, slideCount) {
    for (let i = 0; i < slideCount; i++) {
      const cloneSlide = slide[i].cloneNode(true);
      cloneSlide.classList.add("clone");
      slides.appendChild(cloneSlide);
    }
    for (let i = slideCount - 1; i >= 0; i--) {
      const cloneSlide = slide[i].cloneNode(true);
      cloneSlide.classList.add("clone");
      slides.prepend(cloneSlide);
    }
  }
  function updateWidth(slides, slideWidth) {
    const currentSlides = document.querySelectorAll(".banner");
    const newSlideCount = currentSlides.length;
    const newWidth = (slideWidth + slideGap) * newSlideCount - slideGap + "px";
    slides.style.width = newWidth;
  }
  function setInitialPos(slides, slideWidth, slideCount) {
    const initialTranslateValue = -(slideWidth + slideGap) * slideCount;
    slides.style.transform = `translateX(${initialTranslateValue}px)`;
  }

  function handleNext() {
    moveSlide(currentIdx + 1);
  }
  function handlePrev() {
    moveSlide(currentIdx - 1);
  }
  function moveSlide(num) {
    const slides = document.querySelector(".banner_wrap");
    const slide = document.querySelectorAll(".banner");
    const slideWidth = slide[0].getBoundingClientRect().width;
    const slideCount = streamers.length;

    slides.style.transform = `translateX(${
      -num * (slideWidth + slideGap) - slideCount * (slideWidth + slideGap)
    }px)`;
    setCurrentIdx(num);

    if (num === slideCount || num === -slideCount) {
      setTimeout(() => {
        slides.classList.remove("animated");
        slides.style.transform = `translateX(${
          -slideCount * (slideWidth + slideGap)
        }px)`;
        setCurrentIdx(0);
      }, 500);
      setTimeout(() => {
        slides.classList.add("animated");
      }, 600);
    }
  }

  return (
    <div className="carousel">
      <div className="carousel_container container">
        <div className="ov_hidden">
          <div className="banner_wrap">
            {streamers.map((streamer, index) => (
              <div
                className="banner"
                key={index}
                style={{
                  backgroundImage: `url(${streamer.banner})`,
                }}
              >
                <div className="benner_title fb">{streamer.name}</div>
                <div className="benner_link">
                  <a
                    href={streamer.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src="/youtube.svg" alt="youtube" />
                  </a>
                  <a
                    href="https://cafe.naver.com/steamindiegame"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src="/cafe.svg" alt="cafe" />
                  </a>
                  <a
                    href={streamer.soop}
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
          <button onClick={handlePrev} aria-label="이전 슬라이드">
            <ChevronLeft />
          </button>
          <button onClick={handleNext} aria-label="다음 슬라이드">
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Carousel;
