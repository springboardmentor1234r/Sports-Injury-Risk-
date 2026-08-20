import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import {
    FaUsers,
    FaVideo,
    FaExclamationTriangle,
    FaFilePdf,
    FaUpload,
    FaChartLine,
    FaHistory,
    FaUserShield,
    FaRunning
} from "react-icons/fa";

import "../styles/CoachDashboard.css";


function CoachDashboard() {

    const navigate = useNavigate();

    // ==========================================================
    // Dashboard State
    // ==========================================================

    const [dashboardData, setDashboardData] = useState({
        total_athletes: 0,
        videos_analyzed: 0,
        high_risk_cases: 0,
        reports_generated: 0,

        low_risk: 0,
        moderate_risk: 0,
        high_risk: 0,

        high_risk_athletes: []
    });

    const [recentActivity, setRecentActivity] = useState([]);

    const [loading, setLoading] = useState(true);


    // ==========================================================
    // Logged-in Coach
    // ==========================================================

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    // ==========================================================
    // Load Dashboard
    // ==========================================================

    useEffect(() => {

        fetchDashboardData();

    }, []);


    // ==========================================================
    // Fetch Dashboard + History
    // ==========================================================

    const fetchDashboardData = async () => {

        try {

            setLoading(true);

            // --------------------------------------------------
            // Get dashboard statistics
            // --------------------------------------------------

            const dashboardResponse =
                await api.get("/dashboard");

            console.log(
                "Dashboard Data:",
                dashboardResponse.data
            );

            setDashboardData({

                total_athletes:
                    dashboardResponse.data.total_athletes || 0,

                videos_analyzed:
                    dashboardResponse.data.videos_analyzed || 0,

                high_risk_cases:
                    dashboardResponse.data.high_risk_cases || 0,

                reports_generated:
                    dashboardResponse.data.reports_generated || 0,

                low_risk:
                    dashboardResponse.data.low_risk || 0,

                moderate_risk:
                    dashboardResponse.data.moderate_risk || 0,

                high_risk:
                    dashboardResponse.data.high_risk || 0,

                high_risk_athletes:
                    dashboardResponse.data.high_risk_athletes || []

            });


            // --------------------------------------------------
            // Get analysis history
            // --------------------------------------------------

            const historyResponse =
                await api.get("/history");

            const history =
                historyResponse.data || [];


            console.log(
                "History:",
                history
            );


            // --------------------------------------------------
            // Recent Activity
            // --------------------------------------------------

            const formattedActivity =
                history
                    .slice(-5)
                    .reverse()
                    .map((item) => {

                        let risk =
                            item.injury_risk ||
                            item.injury_prediction?.risk_level ||
                            "Unknown";


                        // Make risk display consistent
                        risk =
                            String(risk)
                                .toLowerCase()
                                .replace(/\b\w/g, char =>
                                    char.toUpperCase()
                                );


                        return {

                            athlete:
                                item.athlete_name ||
                                "Unknown Athlete",

                            risk: risk,

                            time:
                                item.date ||
                                ""

                        };

                    });


            setRecentActivity(
                formattedActivity
            );

        }

        catch (error) {

            console.error(
                "Failed to load coach dashboard:",
                error
            );

        }

        finally {

            setLoading(false);

        }

    };


    // ==========================================================
    // Risk Counts
    // ==========================================================

    const lowRisk =
        Number(dashboardData.low_risk) || 0;

    const moderateRisk =
        Number(dashboardData.moderate_risk) || 0;

    const highRisk =
        Number(dashboardData.high_risk) || 0;


    const totalRisk =
        lowRisk +
        moderateRisk +
        highRisk;


    // ==========================================================
    // Dynamic Risk Bar Percentages
    // ==========================================================

    const lowPercentage =
        totalRisk > 0
            ? (lowRisk / totalRisk) * 100
            : 0;


    const moderatePercentage =
        totalRisk > 0
            ? (moderateRisk / totalRisk) * 100
            : 0;


    const highPercentage =
        totalRisk > 0
            ? (highRisk / totalRisk) * 100
            : 0;


    // ==========================================================
    // High Risk Athletes
    // ==========================================================

    const highRiskAthletes =
        dashboardData.high_risk_athletes || [];


    // ==========================================================
    // Loading
    // ==========================================================

    if (loading) {

        return (

            <div className="coach-dashboard">

                <div
                    style={{
                        padding: "40px",
                        textAlign: "center"
                    }}
                >

                    <h2>
                        Loading Coach Dashboard...
                    </h2>

                </div>

            </div>

        );

    }


    // ==========================================================
    // UI
    // ==========================================================

    return (

        <div className="coach-dashboard">


            {/* ==================================================
                HEADER
            ================================================== */}

            <section className="coach-welcome">

                <div className="coach-welcome-content">

                    <span className="coach-badge">
                        SPORTS COACHING
                    </span>


                    <h1>
                        Good Evening,{" "}
                        {user.name || "Coach"} 👋
                    </h1>


                    <p>
                        Monitor athlete performance,
                        analyze injury risk and keep
                        your team training safely.
                    </p>

                </div>


                <div className="coach-profile">

                    <div className="coach-avatar">

                        {(user.name || "C")
                            .charAt(0)
                            .toUpperCase()}

                    </div>


                    <div>

                        <strong>
                            {user.name || "Coach"}
                        </strong>

                        <span>
                            Coach
                        </span>

                    </div>

                </div>

            </section>



            {/* ==================================================
                STATISTICS
            ================================================== */}

            <section className="coach-stats">


                {/* Total Athletes */}

                <div className="coach-stat-card">

                    <div className="coach-stat-icon">
                        <FaUsers />
                    </div>


                    <div className="coach-stat-info">

                        <span>
                            Total Athletes
                        </span>

                        <h2>
                            {dashboardData.total_athletes}
                        </h2>

                        <p>
                            Registered athletes
                        </p>

                    </div>

                </div>



                {/* Videos */}

                <div className="coach-stat-card">

                    <div className="coach-stat-icon">
                        <FaVideo />
                    </div>


                    <div className="coach-stat-info">

                        <span>
                            Videos Analyzed
                        </span>

                        <h2>
                            {dashboardData.videos_analyzed}
                        </h2>

                        <p>
                            Total analyses
                        </p>

                    </div>

                </div>



                {/* High Risk */}

                <div className="coach-stat-card risk-stat">

                    <div className="coach-stat-icon">
                        <FaExclamationTriangle />
                    </div>


                    <div className="coach-stat-info">

                        <span>
                            High Risk Athletes
                        </span>

                        <h2>
                            {dashboardData.high_risk_cases}
                        </h2>

                        <p>
                            Need attention
                        </p>

                    </div>

                </div>



                {/* Reports */}

                <div className="coach-stat-card">

                    <div className="coach-stat-icon">
                        <FaFilePdf />
                    </div>


                    <div className="coach-stat-info">

                        <span>
                            Reports Generated
                        </span>

                        <h2>
                            {dashboardData.reports_generated}
                        </h2>

                        <p>
                            AI reports
                        </p>

                    </div>

                </div>

            </section>



            {/* ==================================================
                MAIN GRID
            ================================================== */}

            <section className="coach-main-grid">


                {/* ==================================================
                    ATHLETE RISK OVERVIEW
                ================================================== */}

                <div className="coach-panel">


                    <div className="panel-heading">

                        <div>

                            <span className="panel-label">
                                TEAM OVERVIEW
                            </span>


                            <h2>
                                Athlete Risk Overview
                            </h2>


                            <p>
                                Current injury risk across your athletes.
                            </p>

                        </div>


                        <div className="panel-heading-icon">
                            <FaRunning />
                        </div>

                    </div>



                    {/* Risk Numbers */}

                    <div className="risk-overview">


                        {/* Low */}

                        <div className="risk-item">

                            <div className="risk-number low">
                                {lowRisk}
                            </div>


                            <div>

                                <strong>
                                    Low Risk
                                </strong>

                                <span>
                                    Athletes
                                </span>

                            </div>

                        </div>



                        {/* Moderate */}

                        <div className="risk-item">

                            <div className="risk-number moderate">
                                {moderateRisk}
                            </div>


                            <div>

                                <strong>
                                    Moderate Risk
                                </strong>

                                <span>
                                    Athletes
                                </span>

                            </div>

                        </div>



                        {/* High */}

                        <div className="risk-item">

                            <div className="risk-number high">
                                {highRisk}
                            </div>


                            <div>

                                <strong>
                                    High Risk
                                </strong>

                                <span>
                                    Athletes
                                </span>

                            </div>

                        </div>

                    </div>



                    {/* Dynamic Risk Bar */}

                    <div className="risk-bar">

                        <div
                            className="risk-low"
                            style={{
                                width:
                                    `${lowPercentage}%`
                            }}
                        />


                        <div
                            className="risk-moderate"
                            style={{
                                width:
                                    `${moderatePercentage}%`
                            }}
                        />


                        <div
                            className="risk-high"
                            style={{
                                width:
                                    `${highPercentage}%`
                            }}
                        />

                    </div>



                    {/* Legend */}

                    <div className="risk-legend">

                        <span>

                            <i className="dot low-dot" />

                            Low

                        </span>


                        <span>

                            <i className="dot moderate-dot" />

                            Moderate

                        </span>


                        <span>

                            <i className="dot high-dot" />

                            High

                        </span>

                    </div>

                </div>



                {/* ==================================================
                    HIGH RISK ATHLETES
                ================================================== */}

                <div className="high-risk-panel">


                    <div className="alert-icon">
                        <FaExclamationTriangle />
                    </div>


                    <span className="panel-label">
                        ATTENTION REQUIRED
                    </span>


                    <h2>
                        High-Risk Athletes
                    </h2>


                    <p>
                        {highRiskAthletes.length} athletes
                        currently require closer monitoring.
                    </p>



                    <div className="high-risk-list">


                        {highRiskAthletes.length === 0 ? (

                            <div
                                className="high-risk-user"
                            >

                                <div className="small-avatar">
                                    ✓
                                </div>


                                <div>

                                    <strong>
                                        No High-Risk Athletes
                                    </strong>

                                    <span>
                                        All athletes are currently safe.
                                    </span>

                                </div>

                            </div>

                        ) : (

                            highRiskAthletes.map(
                                (athlete, index) => {

                                    const athleteName =
                                        athlete.name ||
                                        athlete.athlete ||
                                        "Unknown Athlete";


                                    return (

                                        <div
                                            className="high-risk-user"
                                            key={
                                                athlete.email ||
                                                index
                                            }
                                        >

                                            <div className="small-avatar">

                                                {athleteName
                                                    .charAt(0)
                                                    .toUpperCase()}

                                            </div>


                                            <div>

                                                <strong>
                                                    {athleteName}
                                                </strong>

                                                <span>
                                                    High injury risk
                                                </span>

                                            </div>


                                            <FaExclamationTriangle />

                                        </div>

                                    );

                                }

                            )

                        )}

                    </div>



                    <button
                        className="outline-green-btn"
                        onClick={() =>
                            navigate(
                                "/dashboard/athletes"
                            )
                        }
                    >

                        View Athletes

                    </button>

                </div>

            </section>



            {/* ==================================================
                RECENT ACTIVITY
            ================================================== */}

            <section className="activity-panel">


                <div className="activity-header">

                    <div>

                        <span className="panel-label">
                            LATEST ACTIVITY
                        </span>


                        <h2>
                            Recent Athlete Activity
                        </h2>


                        <p>
                            Latest injury risk assessments from your team.
                        </p>

                    </div>


                    <button
                        className="view-all-btn"
                        onClick={() =>
                            navigate(
                                "/dashboard/history"
                            )
                        }
                    >

                        View All →

                    </button>

                </div>



                <div className="activity-table">


                    {/* Header */}

                    <div className="activity-row activity-head">

                        <span>
                            ATHLETE
                        </span>

                        <span>
                            RISK LEVEL
                        </span>

                        <span>
                            ACTIVITY
                        </span>

                        <span>
                            TIME
                        </span>

                    </div>



                    {/* Data */}

                    {recentActivity.length === 0 ? (

                        <div
                            className="activity-row"
                            style={{
                                justifyContent:
                                    "center"
                            }}
                        >

                            <span>
                                No analysis activity yet.
                            </span>

                        </div>

                    ) : (

                        recentActivity.map(
                            (activity, index) => (

                                <div
                                    className="activity-row"
                                    key={index}
                                >


                                    {/* Athlete */}

                                    <div className="athlete-cell">

                                        <div className="activity-avatar">

                                            {activity.athlete
                                                .charAt(0)
                                                .toUpperCase()}

                                        </div>


                                        <strong>
                                            {activity.athlete}
                                        </strong>

                                    </div>



                                    {/* Risk */}

                                    <div>

                                        <span
                                            className={`risk-badge ${activity.risk.toLowerCase()}`}
                                        >

                                            {activity.risk}

                                        </span>

                                    </div>



                                    {/* Activity */}

                                    <span className="activity-name">

                                        Sports Video Analysis

                                    </span>



                                    {/* Time */}

                                    <span className="activity-time">

                                        {activity.time}

                                    </span>

                                </div>

                            )
                        )

                    )}

                </div>

            </section>



            {/* ==================================================
                QUICK ACTIONS
            ================================================== */}

            <section className="quick-actions">


                <div className="quick-heading">

                    <span className="panel-label">
                        TOOLS
                    </span>


                    <h2>
                        Quick Actions
                    </h2>


                    <p>
                        Access your athlete monitoring
                        and analysis tools.
                    </p>

                </div>



                <div className="coach-action-grid">


                    {/* Manage Athletes */}

                    <div
                        className="coach-action-card"
                        onClick={() =>
                            navigate(
                                "/dashboard/athletes"
                            )
                        }
                    >

                        <div className="action-icon">
                            <FaUsers />
                        </div>


                        <div>

                            <h3>
                                Manage Athletes
                            </h3>

                            <p>
                                View athlete profiles
                                and injury risk.
                            </p>

                        </div>


                        <span>
                            →
                        </span>

                    </div>



                    {/* Upload Video */}

                    <div
                        className="coach-action-card"
                        onClick={() =>
                            navigate(
                                "/dashboard/upload"
                            )
                        }
                    >

                        <div className="action-icon">
                            <FaUpload />
                        </div>


                        <div>

                            <h3>
                                Upload Video
                            </h3>

                            <p>
                                Upload sports videos
                                for AI analysis.
                            </p>

                        </div>


                        <span>
                            →
                        </span>

                    </div>



                    {/* Analysis */}

                    <div
                        className="coach-action-card"
                        onClick={() =>
                            navigate(
                                "/dashboard/analysis"
                            )
                        }
                    >

                        <div className="action-icon">
                            <FaChartLine />
                        </div>


                        <div>

                            <h3>
                                View Analysis
                            </h3>

                            <p>
                                Review injury risk
                                assessments.
                            </p>

                        </div>


                        <span>
                            →
                        </span>

                    </div>



                    {/* Reports */}

                    <div
                        className="coach-action-card"
                        onClick={() =>
                            navigate(
                                "/dashboard/reports"
                            )
                        }
                    >

                        <div className="action-icon">
                            <FaFilePdf />
                        </div>


                        <div>

                            <h3>
                                Reports
                            </h3>

                            <p>
                                View and manage
                                generated reports.
                            </p>

                        </div>


                        <span>
                            →
                        </span>

                    </div>



                    {/* History */}

                    <div
                        className="coach-action-card"
                        onClick={() =>
                            navigate(
                                "/dashboard/history"
                            )
                        }
                    >

                        <div className="action-icon">
                            <FaHistory />
                        </div>


                        <div>

                            <h3>
                                Analysis History
                            </h3>

                            <p>
                                Review previous
                                athlete analyses.
                            </p>

                        </div>


                        <span>
                            →
                        </span>

                    </div>



                    {/* Settings */}

                    <div
                        className="coach-action-card"
                        onClick={() =>
                            navigate(
                                "/dashboard/settings"
                            )
                        }
                    >

                        <div className="action-icon">
                            <FaUserShield />
                        </div>


                        <div>

                            <h3>
                                Settings
                            </h3>

                            <p>
                                Manage your coaching
                                preferences.
                            </p>

                        </div>


                        <span>
                            →
                        </span>

                    </div>

                </div>

            </section>



            {/* ==================================================
                MOTIVATION
            ================================================== */}

            <section className="coach-motivation">


                <div className="motivation-icon">
                    🏆
                </div>


                <div>

                    <span>
                        COACHING MOTIVATION
                    </span>


                    <h2>
                        Train Smart. Monitor Closely.
                        Perform Better.
                    </h2>


                    <p>
                        "The best performance comes
                        from training hard while
                        keeping athletes safe."
                    </p>

                </div>

            </section>


        </div>

    );

}


export default CoachDashboard;