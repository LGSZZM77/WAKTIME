import React, { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import "./FanArt.css";

function FanArt() {
  const [artData, setArtData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/fanArt`)
      .then((res) => res.json())
      .then((data) => setArtData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>로딩 중...</div>;
  if (!artData.length) return <div>팬아트가 없습니다.</div>;

  // 반응형 컬럼 설정: 화면 크기별 컬럼 개수
  const breakpointCols = {
    default: 4, // 1200px 이상
    1024: 3, // 1024px 이상
    768: 2, // 768px 이상
    480: 1, // 480px 이하
  };

  // 레벨에 따른 배경색을 반환하는 함수
  const getBackgroundColor = (level) => {
    switch (level) {
      case 0:
        return "#ffffff"; // 아메바
      case 1:
        return "#ce93d8"; // 진드기
      case 2:
        return "#4fc3f7"; // 닭둘기
      case 3:
        return "#81c784"; // 왁무새
      case 4:
        return "#66bb6a"; // 침팬치
      case 5:
        return "#fbc02d"; // 느그자
      default:
        return "#ffffff"; // 기본 배경색
    }
  };

  return (
    <div className="container">
      <Masonry
        breakpointCols={breakpointCols}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {artData.map((art, idx) => (
          <div key={art.id || idx} className="art_item">
            <a
              href={art.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {art.thumbnail && (
                <img
                  src={`${
                    process.env.REACT_APP_API_URL
                  }/api/fanArt/image-proxy?url=${encodeURIComponent(
                    art.thumbnail
                  )}`}
                  alt={art.title || "팬아트 이미지"}
                />
              )}
              <div className="art_item-content">
                <h3>
                  {art.title || "제목 없음"}
                  {art.commentCount > 0 && <span> [{art.commentCount}]</span>}
                </h3>
                <div className="art_item-meta">
                  <div className="art_item-meta_top">
                    <span>{art.author || "익명"}</span>
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
                    <span>{art.date || "날짜 없음"}</span>·
                    <span>조회 {art.viewCount || 0}</span>
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
