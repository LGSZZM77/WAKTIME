import React, { useState } from "react";
import IsedolProfile from "../components/views/IsedolProfile/IsedolProfile";
import IsedolVideo from "../components/views/IsedolVideo/IsedolVideo";
import { ISEDOL_MEMBERS } from "../data/ISEDOL_MEMBERS";

export default function IsedolPage() {
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  const handleProfileClick = (indexOrNull) => {
    if (indexOrNull === null) {
      setSelectedChannelId(null);
    } else {
      setSelectedChannelId(ISEDOL_MEMBERS[indexOrNull].channelId);
    }
  };

  return (
    <div className="subpage">
      <IsedolProfile onProfileClick={handleProfileClick} />
      {selectedChannelId && <IsedolVideo channelId={selectedChannelId} />}
    </div>
  );
}
