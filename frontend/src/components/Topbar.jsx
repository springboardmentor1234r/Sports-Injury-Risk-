import React from "react";
import {
  FaBell,
  FaSearch,
  FaUserCircle,
} from "react-icons/fa";

import "../styles/Topbar.css";

function Topbar() {
  return (
    <header className="topbar">

      <div className="topbar-left">

        <h2>👋 Welcome Back</h2>

        <p>
          Sports Injury Risk Detection Dashboard
        </p>

      </div>

      <div className="topbar-right">

        <div className="search-box">

          <FaSearch />

          <input
            type="text"
            placeholder="Search..."
          />

        </div>

        <button className="icon-btn">
          <FaBell />
        </button>

        <button className="profile-btn">

          <FaUserCircle />

          <span>Sejal</span>

        </button>

      </div>

    </header>
  );
}

export default Topbar;