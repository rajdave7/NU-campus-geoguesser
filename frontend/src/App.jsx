import { useState } from "react";
import "./App.css";

import logo from "./assets/nu-wildcats-logo.png";
import wildcat from "./assets/wildcat-nu.png";
import campus from "./assets/campus-photo.webp";
import PlayTab from "./components/PlayTab";
import LeaderboardTab from "./components/LeaderBoardTab.jsx";
import UploadTab from "./components/UploadTab.jsx";
const TABS = {
  PLAY: "play",
  UPLOAD: "upload",
  LEADERBOARD: "leaderboard",
};

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.PLAY);

  return (
    <div className="app" style={{ backgroundImage: `url(${campus})` }}>
      <div className="overlay">
        <header className="hero">
          <img src={logo} alt="Northwestern Wildcats logo" className="logo" />

          <h1 className="title">Northwestern GeoGuessr</h1>

          <p className="subtitle">
            Guess where each photo was taken across campus.
          </p>

          <img src={wildcat} alt="Northwestern wildcat" className="wildcat" />
        </header>

        <div className="tabs">
          <button
            className={activeTab === TABS.PLAY ? "tab active" : "tab"}
            onClick={() => setActiveTab(TABS.PLAY)}
          >
            Play
          </button>

          <button
            className={activeTab === TABS.UPLOAD ? "tab active" : "tab"}
            onClick={() => setActiveTab(TABS.UPLOAD)}
          >
            Upload Photos
          </button>

          <button
            className={activeTab === TABS.LEADERBOARD ? "tab active" : "tab"}
            onClick={() => setActiveTab(TABS.LEADERBOARD)}
          >
            Leaderboard
          </button>
        </div>

        <div className="content">
          {activeTab === TABS.PLAY && <PlayTab />}

          {activeTab === TABS.UPLOAD && <UploadTab />}

          {activeTab === TABS.LEADERBOARD && <LeaderboardTab />}
        </div>
      </div>
    </div>
  );
}