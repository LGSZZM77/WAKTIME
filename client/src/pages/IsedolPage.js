// src/pages/IsedolPage.jsx
import React, { useState } from "react";
import IsedolProfile from "../components/views/IsedolProfile/IsedolProfile";
import IsedolVideo from "../components/views/IsedolVideo/IsedolVideo";

// 인덱스별 채널 ID 맵핑
const CHANNEL_IDS = [
  "UCroM00J2ahCN6k-0-oAiDxg", // INE
  "UCHE7GBQVtdh-c1m3tjFdevQ", // JINGBURGER
  "UC-oCJP9t47v7-DmsnmXV38Q", // LILPA
  "UCTifMx1ONpElK5x6B4ng8eg", // JURURU
  "UCV9WL7sW6_KjanYkUUaIDfQ", // GOSEGU
  "UCs6EwgxKLY9GG4QNUrP5hoQ", // VIICHAN
  "UCzh4yY8rl38knH33XpNqXbQ", // WAKTAVERSE
];

export default function IsedolPage() {
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  const handleProfileClick = (indexOrNull) => {
    if (indexOrNull === null) {
      setSelectedChannelId(null);
    } else {
      setSelectedChannelId(CHANNEL_IDS[indexOrNull]);
    }
  };

  return (
    <div className="subpage">
      <IsedolProfile onProfileClick={handleProfileClick} />
      {selectedChannelId && <IsedolVideo channelId={selectedChannelId} />}
    </div>
  );
}
