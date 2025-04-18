import React, { useState } from "react";
import "./IsedolProfile.css";

// 바깥에서 초기 순서 정의
const ORIGINAL_ORDER = [0, 1, 2, 3, 4, 5, 6];

function IsedolProfile({ onProfileClick }) {
  const [active, setActive] = useState(null);
  const [displayedOrder, setDisplayedOrder] = useState([...ORIGINAL_ORDER]);

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
    return displayedOrder.map((idx) => (
      <div
        key={idx}
        className={`circle ${active === idx ? "active" : ""}`}
        onClick={() => handleCircleClick(idx)}
      >
        {idx}
      </div>
    ));
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
