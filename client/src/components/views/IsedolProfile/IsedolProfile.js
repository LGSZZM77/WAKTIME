import React, { useState, useEffect } from "react";
import "./IsedolProfile.css";
import { ISEDOL_MEMBERS } from "../../../data/ISEDOL_MEMBERS";

const ORIGINAL_ORDER = ISEDOL_MEMBERS.map((_, idx) => idx);

function IsedolProfile({ onProfileClick }) {
  const [active, setActive] = useState(null);
  const [displayedOrder, setDisplayedOrder] = useState([...ORIGINAL_ORDER]);
  const [visibleProfiles, setVisibleProfiles] = useState([]);

  // 초기 마운트 시 프로필을 순차적으로 나타나게 하는 효과
  useEffect(() => {
    const showProfilesSequentially = () => {
      displayedOrder.forEach((idx, i) => {
        setTimeout(() => {
          setVisibleProfiles((prev) => [...prev, idx]);
        }, i * 100);
      });
    };

    showProfilesSequentially();

    // 컴포넌트 언마운트 시 초기화
    return () => setVisibleProfiles([]);
  }, []);

  const handleCircleClick = (index) => {
    const isSame = active === index;

    if (isSame) {
      setActive(null);
      restoreOriginalOrder();
      onProfileClick(null);
    } else {
      setActive(index);
      moveToCenter(index);
      onProfileClick(index);
    }
  };

  const moveToCenter = (index) => {
    const middleIndex = Math.floor(displayedOrder.length / 2);
    const currentIndex = displayedOrder.indexOf(index);
    if (currentIndex !== middleIndex) {
      const newOrder = [...displayedOrder];
      newOrder.splice(currentIndex, 1);
      newOrder.splice(middleIndex, 0, index);
      setDisplayedOrder(newOrder);
    }
  };

  const restoreOriginalOrder = () => {
    setDisplayedOrder([...ORIGINAL_ORDER]);
  };

  const renderCircles = () => {
    return displayedOrder.map((idx) => {
      const member = ISEDOL_MEMBERS[idx];
      const isVisible = visibleProfiles.includes(idx);

      return (
        <div
          key={idx}
          className={`circle ${active === idx ? "active" : ""} ${
            isVisible ? "visible" : ""
          }`}
          onClick={() => handleCircleClick(idx)}
        >
          <img
            src={member.imageUrl}
            alt={`Profile of ${member.name}`}
            className="profile_image"
          />
        </div>
      );
    });
  };

  return (
    <div
      className={`circle_container container ${
        active !== null ? "shifted" : ""
      }`}
    >
      <div className={`circle_wrap ${active !== null ? "shifted" : ""}`}>
        {renderCircles()}
      </div>
    </div>
  );
}

export default IsedolProfile;
