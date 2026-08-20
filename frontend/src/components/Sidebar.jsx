import React from "react";
import { NavLink } from "react-router-dom";

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

import runnerImage from "../assets/images/runner.png";
import logo from "../assets/images/logo.png";

import "../styles/Sidebar.css";


function Sidebar() {

    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role?.toLowerCase() || "athlete";

    let menuItems = [];


    /* =========================================
       ATHLETE MENU
    ========================================= */

    if (role === "athlete") {

        menuItems = [
            {
                title: "Dashboard",
                path: "/dashboard/athlete-home",
                icon: <MdDashboard />,
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

    }


    /* =========================================
       COACH MENU
    ========================================= */

    else if (role === "coach") {

        menuItems = [
            {
                title: "Dashboard",
                path: "/dashboard/coach-home",
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

    }


    /* =========================================
       ADMIN MENU
    ========================================= */

    else if (role === "admin") {

        menuItems = [
            {
                title: "Dashboard",
                path: "/dashboard/admin-home",
                icon: <MdDashboard />,
            },
            {
                title: "User Management",
                path: "/dashboard/admin",
                icon: <FaUsers />,
            },
            {
                title: "Athletes",
                path: "/dashboard/athletes",
                icon: <FaUsers />,
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

    }


    return (

        <aside className="sidebar">


            {/* =========================================
                LOGO
            ========================================= */}

            <div className="sidebar-logo">

                <img
                    src={logo}
                    alt="Sports Injury Logo"
                />

                <div className="sidebar-brand">

                    <h2>Sports Injury</h2>

                    <p>Risk Detection</p>

                </div>

            </div>


            {/* =========================================
                NAVIGATION
            ========================================= */}

            <nav className="sidebar-nav">

                {menuItems.map((item) => (

                    <NavLink
                        key={item.title}
                        to={item.path}
                        end={item.title === "Dashboard"}
                        className={({ isActive }) =>
                            isActive
                                ? "sidebar-link active"
                                : "sidebar-link"
                        }
                    >

                        <span className="sidebar-icon">
                            {item.icon}
                        </span>

                        <span className="sidebar-link-text">
                            {item.title}
                        </span>

                    </NavLink>

                ))}

            </nav>


            {/* =========================================
                AI POWERED CARD
            ========================================= */}

            <div className="sidebar-footer">

                <div className="runner-container">

                    <img
                        src={runnerImage}
                        alt="AI Powered"
                        className="runner-image"
                    />

                </div>

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