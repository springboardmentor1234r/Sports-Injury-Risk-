import React from "react";
import { NavLink } from "react-router-dom";
import runnerImage from "../assets/runner.png";

import {
  MdDashboard,
  MdUpload,
  MdSettings,
} from "react-icons/md";

import {
  FaUsers,
  FaChartLine,
  FaFilePdf,
  FaHistory,
  FaQuestionCircle,
} from "react-icons/fa";

import "../styles/Sidebar.css";

import logo from "../assets/images/logo.png";

function Sidebar() {
  const menuItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <MdDashboard />,
    },
    {
      title: "Athletes",
      path: "/dashboard/athletes",
      icon: <FaUsers />,
    },
    {
      title: "Upload Video",
      path: "/dashboard/upload",
      icon: <MdUpload />,
    },
    {
      title: "Analysis",
      path: "/dashboard/analysis",
      icon: <FaChartLine />,
    },
    {
      title: "Reports",
      path: "/dashboard/reports",
      icon: <FaFilePdf />,
    },
    {
      title: "History",
      path: "/dashboard/history",
      icon: <FaHistory />,
    },
    {
      title: "Settings",
      path: "/dashboard/settings",
      icon: <MdSettings />,
    },
    {
      title: "Help",
      path: "/dashboard/help",
      icon: <FaQuestionCircle />,
    },
  ];

  return (
    <aside className="sidebar">

      {/* Logo */}

      <div className="sidebar-logo">
        <img src={logo} alt="Sports Injury Logo" />

        <div>
          <h2>Sports Injury</h2>
          <p>Risk Detection</p>
        </div>
      </div>

      {/* Navigation */}

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}

      <div className="sidebar-footer">

        <img
  src={runnerImage}
  alt="AI Runner"
  className="runner-image"
/>
        <h3>AI Powered</h3>

        <p>
          Detect.
          <br />
          Analyze.
          <br />
          Prevent.
        </p>

      </div>

    </aside>
  );
}

export default Sidebar;