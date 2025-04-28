import React, { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import "./FanArt.css";

// 1) 컴포넌트 바깥으로 뺀 브레이크포인트
const BREAKPOINT_COLS = {
  default: 4, // 1200px 이상
  1024: 3, // 1024px 이상
  768: 2, // 768px 이상
  480: 1, // 480px 이하
};

// 2) 레벨→배경색 매핑
const LEVEL_COLOR_MAP = {
  0: "#ffffff", // 아메바
  1: "#ce93d8", // 진드기
  2: "#4fc3f7", // 닭둘기
  3: "#81c784", // 왁무새
  4: "#66bb6a", // 침팬치
  5: "#fbc02d", // 느그자
};
const getBackgroundColor = (level) =>
  LEVEL_COLOR_MAP[level] ?? LEVEL_COLOR_MAP[0];

function FanArt() {
  const [artData, setArtData] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/fanArt`);
        const data = await res.json();
        setArtData(data);
      } catch (err) {
        console.error("팬아트 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiUrl]);

  if (loading) return <div className="loading">로딩 중...</div>;
  if (artData.length === 0)
    return <div className="no-data">팬아트 불러오기를 실패했습니다.</div>;

  return (
    <div className="fanart_container container">
      <Masonry
        breakpointCols={BREAKPOINT_COLS}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {artData.map((art, idx) => (
          <div key={art.id ?? idx} className="art_item">
            <a
              href={art.href}
              target="_blank"
              rel="noopener noreferrer"
              className="art_item-link"
            >
              {art.thumbnail && (
                <img
                  crossOrigin="anonymous"
                  className="art_item-thumb"
                  src={`${apiUrl}/api/fanArt/image-proxy?url=${encodeURIComponent(
                    art.thumbnail
                  )}`}
                  alt={art.title || "팬아트 이미지"}
                  loading="eager"
                />
              )}

              <div className="art_item-content">
                <h3 className="art_item-title">
                  {art.title || "제목 없음"}
                  {art.commentCount > 0 && <span> [{art.commentCount}]</span>}
                </h3>

                <div className="art_item-meta">
                  <div className="art_item-meta_top">
                    <span className="author">{art.author || "익명"}</span>
                    {art.memberLevel && (
                      <span
                        className="memberLevel"
                        style={{
                          backgroundColor: getBackgroundColor(art.memberLevel),
                          color: "#fff",
                        }}
                      >
                        {art.memberLevel}
                      </span>
                    )}
                  </div>

                  <div className="art_item-meta_bottom">
                    <span className="date">{art.date || "날짜 없음"}</span>·
                    <span className="views">조회 {art.viewCount ?? 0}</span>
                  </div>
                </div>
              </div>
            </a>
          </div>
        ))}
      </Masonry>
    </div>
  );
}

export default FanArt;
