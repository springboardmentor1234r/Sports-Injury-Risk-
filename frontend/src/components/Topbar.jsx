import React from "react";
import {
  FaBell,
  FaSearch,
  FaUserCircle
} from "react-icons/fa";

import "../styles/Topbar.css";

function Topbar() {

  const user = JSON.parse(localStorage.getItem("user"));

  const name = user?.name || "Guest";
  const role = user?.role || "Athlete";

  return (
    <header className="topbar">

      <div className="search-box">

        <FaSearch />

        <input
          type="text"
          placeholder="Search..."
        />

      </div>

      <div className="topbar-right">

        <button className="icon-btn">
          <FaBell />
        </button>

        <div className="profile-btn">

          <FaUserCircle className="profile-icon" />

          <div className="profile-info">

            <span className="profile-name">
              {name}
            </span>

            <small className="profile-role">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </small>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;