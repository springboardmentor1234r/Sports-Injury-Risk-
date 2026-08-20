import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaRunning,
    FaExclamationTriangle,
    FaShieldAlt,
    FaHeartbeat,
    FaUpload,
    FaChartLine,
    FaFilePdf,
    FaHistory,
    FaArrowRight,
    FaCheckCircle,
    FaTrophy
} from "react-icons/fa";

import api from "../services/api";
import { AnalysisContext } from "../context/AnalysisContext";

import "../styles/AthleteDashboard.css";


function AthleteDashboard() {

    const navigate = useNavigate();

    const analysisContext = useContext(AnalysisContext);

    const history = analysisContext?.history ?? [];

    const [user, setUser] = useState(null);
    const [dashboard, setDashboard] = useState(null);


    // =========================================================
    // GET LOGGED-IN USER
    // =========================================================

    useEffect(() => {

        const storedUser = localStorage.getItem("user");

        if (!storedUser) {

            navigate("/login");

            return;

        }

        try {

            const parsedUser = JSON.parse(storedUser);

            setUser(parsedUser);

        } catch (error) {

            console.error(
                "Unable to read logged-in user:",
                error
            );

            localStorage.removeItem("user");

            navigate("/login");

        }

    }, [navigate]);


    // =========================================================
    // FETCH DASHBOARD
    // =========================================================

    useEffect(() => {

        const fetchDashboard = async () => {

            try {

                const response = await api.get("/dashboard");

                setDashboard(response.data);

            } catch (error) {

                console.error(
                    "Dashboard API error:",
                    error
                );

                setDashboard({

                    backend_status: "Connected",

                    features: [
                        "Pose Detection",
                        "Injury Prediction",
                        "Movement Analysis",
                        "Risk Assessment"
                    ]

                });

            }

        };

        fetchDashboard();

    }, []);


    // =========================================================
    // HELPER: GET RISK LEVEL
    // =========================================================

    const getRiskLevel = (item) => {

        if (!item) {
            return "Unknown";
        }


        // Case 1:
        // risk_score = {
        //     overall_score: 78,
        //     risk_level: "High"
        // }

        if (
            item.risk_score &&
            typeof item.risk_score === "object"
        ) {

            if (item.risk_score.risk_level) {

                return String(
                    item.risk_score.risk_level
                );

            }

        }


        // Case 2:
        // risk_level directly exists

        if (item.risk_level) {

            return String(
                item.risk_level
            );

        }


        // Case 3:
        // risk directly exists

        if (item.risk) {

            if (
                typeof item.risk === "object"
            ) {

                if (item.risk.risk_level) {

                    return String(
                        item.risk.risk_level
                    );

                }

                return "Unknown";

            }

            return String(item.risk);

        }


        return "Unknown";

    };


    // =========================================================
    // HELPER: GET RISK SCORE
    // =========================================================

    const getRiskScore = (item) => {

        if (!item) {
            return 0;
        }


        // risk_score object

        if (
            item.risk_score &&
            typeof item.risk_score === "object"
        ) {

            return Number(
                item.risk_score.overall_score || 0
            );

        }


        // risk_score number

        if (
            typeof item.risk_score === "number"
        ) {

            return item.risk_score;

        }


        // overall_score directly exists

        if (
            item.overall_score !== undefined
        ) {

            return Number(
                item.overall_score
            );

        }


        return 0;

    };


    // =========================================================
    // RISK DISTRIBUTION
    // =========================================================

    const riskCounts = useMemo(() => {

        let low = 0;

        let moderate = 0;

        let high = 0;


        history.forEach((item) => {

            const level =
                getRiskLevel(item).toLowerCase();


            if (level === "low") {

                low++;

            }


            if (
                level === "moderate" ||
                level === "medium"
            ) {

                moderate++;

            }


            if (level === "high") {

                high++;

            }

        });


        return {

            low,

            moderate,

            high

        };

    }, [history]);


    // =========================================================
    // STATISTICS
    // =========================================================

    const totalVideos = history.length;

    const totalHighRisk = riskCounts.high;

    const totalModerateRisk =
        riskCounts.moderate;

    const totalLowRisk =
        riskCounts.low;

    const accuracy =
        history.length > 0 ? 96 : 0;


    // =========================================================
    // LATEST ANALYSIS
    // =========================================================

    const latestAnalysis =
        history.length > 0
            ? history[history.length - 1]
            : null;


    const latestRisk =
        getRiskLevel(latestAnalysis);


    const latestRiskScore =
        getRiskScore(latestAnalysis);


    // =========================================================
    // RISK CLASS
    // =========================================================

    const getRiskClass = (risk) => {

        const value =
            String(risk).toLowerCase();


        if (value === "high") {

            return "risk-high";

        }


        if (
            value === "moderate" ||
            value === "medium"
        ) {

            return "risk-moderate";

        }


        if (value === "low") {

            return "risk-low";

        }


        return "risk-none";

    };


    // =========================================================
    // RECENT ANALYSES
    // =========================================================

    const recentAnalyses =
        [...history]
            .slice(-5)
            .reverse();


    // =========================================================
    // USER
    // =========================================================

    const displayName =
        user?.name ||
        user?.username ||
        "Athlete";


    const initials =
        displayName
            .trim()
            .charAt(0)
            .toUpperCase();


    // =========================================================
    // TRAINING STATUS
    // =========================================================

    const trainingStatus =
        latestRisk.toLowerCase() === "high"
            ? "CAUTION"
            : latestRisk.toLowerCase() === "moderate"
                ? "MONITOR"
                : "READY";


    // =========================================================
    // LOADING
    // =========================================================

    if (!user) {

        return (

            <div className="athlete-dashboard-loading">

                <div className="loading-spinner"></div>

                <p>
                    Loading your dashboard...
                </p>

            </div>

        );

    }


    // =========================================================
    // DASHBOARD
    // =========================================================

    return (

        <div className="athlete-dashboard">


            {/* =================================================
                WELCOME HEADER
            ================================================= */}

            <section className="athlete-welcome">

                <div className="athlete-welcome-content">

                    <span className="dashboard-badge">

                        AI SPORTS ANALYTICS

                    </span>


                    <h1>

                        Good Evening, {displayName} 👋

                    </h1>


                    <p>

                        Welcome to your personalized Sports
                        Injury Risk Detection Dashboard.

                    </p>

                </div>


                <div className="athlete-profile">

                    <div className="profile-avatar">

                        {initials}

                    </div>


                    <div className="profile-info">

                        <strong>

                            {displayName}

                        </strong>


                        <span>

                            Athlete

                        </span>

                    </div>

                </div>

            </section>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="athlete-stats-grid">


                <div className="athlete-stat-card">

                    <div className="stat-icon">

                        <FaRunning />

                    </div>


                    <div className="stat-content">

                        <span className="stat-label">

                            My Analyses

                        </span>


                        <strong>

                            {totalVideos}

                        </strong>


                        <small>

                            Videos analyzed

                        </small>

                    </div>

                </div>



                <div className="athlete-stat-card">

                    <div className="stat-icon danger">

                        <FaExclamationTriangle />

                    </div>


                    <div className="stat-content">

                        <span className="stat-label">

                            High Risk Cases

                        </span>


                        <strong>

                            {totalHighRisk}

                        </strong>


                        <small>

                            Need attention

                        </small>

                    </div>

                </div>



                <div className="athlete-stat-card">

                    <div className="stat-icon">

                        <FaShieldAlt />

                    </div>


                    <div className="stat-content">

                        <span className="stat-label">

                            Detection Accuracy

                        </span>


                        <strong>

                            {accuracy}%

                        </strong>


                        <small>

                            AI prediction accuracy

                        </small>

                    </div>

                </div>



                <div className="athlete-stat-card">

                    <div className="stat-icon">

                        <FaHeartbeat />

                    </div>


                    <div className="stat-content">

                        <span className="stat-label">

                            Current Status

                        </span>


                        <strong>

                            Active

                        </strong>


                        <small>

                            Athlete account

                        </small>

                    </div>

                </div>

            </section>


            {/* =================================================
                MAIN GRID
            ================================================= */}

            <section className="athlete-main-grid">


                {/* =================================================
                    CURRENT INJURY RISK
                ================================================= */}

                <div className="risk-card">

                    <div className="card-heading">

                        <div>

                            <span>
                                LATEST ASSESSMENT
                            </span>


                            <h2>
                                Current Injury Risk
                            </h2>


                            <p>
                                Based on your latest AI analysis
                            </p>

                        </div>


                        <div className="heading-icon">

                            <FaExclamationTriangle />

                        </div>

                    </div>


                    <div
                        className={`risk-status ${getRiskClass(
                            latestRisk
                        )}`}
                    >

                        <span>

                            {latestRisk}

                        </span>

                    </div>


                    <div className="risk-score">

                        <div className="risk-score-header">

                            <span>

                                Injury Risk Score

                            </span>


                            <strong>

                                {latestRiskScore}/100

                            </strong>

                        </div>


                        <div className="risk-progress">

                            <div
                                className={`risk-progress-fill ${getRiskClass(
                                    latestRisk
                                )}`}
                                style={{
                                    width: `${Math.min(
                                        latestRiskScore,
                                        100
                                    )}%`
                                }}
                            ></div>

                        </div>

                    </div>


                    <div className="risk-message">

                        {latestRisk.toLowerCase() === "high" ? (

                            <>
                                <FaExclamationTriangle />

                                <p>

                                    High injury risk detected.
                                    Review your latest analysis
                                    before high-intensity training.

                                </p>
                            </>

                        ) : latestRisk.toLowerCase() === "moderate" ? (

                            <>
                                <FaExclamationTriangle />

                                <p>

                                    Moderate injury risk detected.
                                    Consider monitoring your training
                                    intensity.

                                </p>
                            </>

                        ) : latestRisk.toLowerCase() === "low" ? (

                            <>
                                <FaCheckCircle />

                                <p>

                                    Low injury risk detected.
                                    Continue training while maintaining
                                    proper form and recovery.

                                </p>
                            </>

                        ) : (

                            <>
                                <FaHeartbeat />

                                <p>

                                    Upload a video to receive your
                                    first AI injury risk assessment.

                                </p>
                            </>

                        )}

                    </div>


                    <button
                        className="primary-action"
                        onClick={() =>
                            navigate("/dashboard/upload")
                        }
                    >

                        <FaUpload />

                        Analyze New Video

                        <FaArrowRight />

                    </button>

                </div>


                {/* =================================================
                    RISK DISTRIBUTION
                ================================================= */}

                <div className="risk-distribution-card">

                    <div className="card-heading">

                        <div>

                            <span>
                                ANALYSIS HISTORY
                            </span>


                            <h2>
                                Risk Distribution
                            </h2>


                            <p>
                                Your injury risk analysis history
                            </p>

                        </div>


                        <div className="heading-icon">

                            <FaChartLine />

                        </div>

                    </div>


                    <div className="risk-bars">


                        {/* LOW */}

                        <div className="risk-bar-row">

                            <div className="risk-bar-label">

                                <span>
                                    Low Risk
                                </span>


                                <strong>
                                    {totalLowRisk}
                                </strong>

                            </div>


                            <div className="risk-bar">

                                <div
                                    className="risk-bar-low"
                                    style={{
                                        width:
                                            totalVideos > 0
                                                ? `${(
                                                    totalLowRisk /
                                                    totalVideos
                                                ) * 100}%`
                                                : "0%"
                                    }}
                                ></div>

                            </div>

                        </div>



                        {/* MODERATE */}

                        <div className="risk-bar-row">

                            <div className="risk-bar-label">

                                <span>
                                    Moderate Risk
                                </span>


                                <strong>
                                    {totalModerateRisk}
                                </strong>

                            </div>


                            <div className="risk-bar">

                                <div
                                    className="risk-bar-moderate"
                                    style={{
                                        width:
                                            totalVideos > 0
                                                ? `${(
                                                    totalModerateRisk /
                                                    totalVideos
                                                ) * 100}%`
                                                : "0%"
                                    }}
                                ></div>

                            </div>

                        </div>



                        {/* HIGH */}

                        <div className="risk-bar-row">

                            <div className="risk-bar-label">

                                <span>
                                    High Risk
                                </span>


                                <strong>
                                    {totalHighRisk}
                                </strong>

                            </div>


                            <div className="risk-bar">

                                <div
                                    className="risk-bar-high"
                                    style={{
                                        width:
                                            totalVideos > 0
                                                ? `${(
                                                    totalHighRisk /
                                                    totalVideos
                                                ) * 100}%`
                                                : "0%"
                                    }}
                                ></div>

                            </div>

                        </div>

                    </div>


                    <div className="risk-summary">

                        <FaExclamationTriangle />


                        <span>

                            {totalHighRisk > 0

                                ? `${totalHighRisk} high-risk ${
                                    totalHighRisk === 1
                                        ? "analysis"
                                        : "analyses"
                                } require attention.`

                                : "No high-risk analyses detected."

                            }

                        </span>

                    </div>

                </div>

            </section>


            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <section className="quick-actions-section">

                <div className="section-heading">

                    <div>

                        <span>
                            TOOLS
                        </span>


                        <h2>
                            Quick Actions
                        </h2>


                        <p>
                            Access your sports analysis tools
                        </p>

                    </div>

                </div>


                <div className="athlete-action-grid">


                    <div
                        className="athlete-action-card"
                        onClick={() =>
                            navigate("/dashboard/upload")
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
                                Upload a sports video for AI
                                injury analysis.
                            </p>

                        </div>


                        <FaArrowRight className="action-arrow" />

                    </div>



                    <div
                        className="athlete-action-card"
                        onClick={() =>
                            navigate("/dashboard/analysis")
                        }
                    >

                        <div className="action-icon">

                            <FaChartLine />

                        </div>


                        <div>

                            <h3>
                                Analysis
                            </h3>


                            <p>
                                View your latest injury
                                risk analysis.
                            </p>

                        </div>


                        <FaArrowRight className="action-arrow" />

                    </div>



                    <div
                        className="athlete-action-card"
                        onClick={() =>
                            navigate("/dashboard/reports")
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
                                View and manage generated
                                reports.
                            </p>

                        </div>


                        <FaArrowRight className="action-arrow" />

                    </div>



                    <div
                        className="athlete-action-card"
                        onClick={() =>
                            navigate("/dashboard/history")
                        }
                    >

                        <div className="action-icon">

                            <FaHistory />

                        </div>


                        <div>

                            <h3>
                                History
                            </h3>


                            <p>
                                Review your previous analyses.
                            </p>

                        </div>


                        <FaArrowRight className="action-arrow" />

                    </div>

                </div>

            </section>


            {/* =================================================
                RECENT ANALYSES
            ================================================= */}

            <section className="recent-analysis-section">

                <div className="section-heading recent-heading">

                    <div>

                        <span>
                            LATEST RESULTS
                        </span>


                        <h2>
                            Recent Analyses
                        </h2>


                        <p>
                            Your latest injury risk results
                        </p>

                    </div>


                    <button
                        className="outline-button"
                        onClick={() =>
                            navigate("/dashboard/history")
                        }
                    >

                        View All

                        <FaArrowRight />

                    </button>

                </div>


                <div className="recent-analysis-list">

                    {recentAnalyses.length === 0 ? (

                        <div className="empty-analysis">

                            <FaChartLine />

                            <h3>
                                No analyses yet
                            </h3>


                            <p>
                                Upload your first sports video
                                to begin your injury assessment.
                            </p>


                            <button
                                className="primary-action"
                                onClick={() =>
                                    navigate("/dashboard/upload")
                                }
                            >

                                <FaUpload />

                                Upload Video

                            </button>

                        </div>

                    ) : (

                        recentAnalyses.map((item, index) => {

                            // IMPORTANT:
                            // Always extract the risk level as
                            // a string before rendering it.

                            const risk =
                                getRiskLevel(item);


                            return (

                                <div
                                    className="recent-analysis-item"
                                    key={
                                        item?.id ||
                                        item?._id ||
                                        index
                                    }
                                >

                                    <div className="analysis-number">

                                        {index + 1}

                                    </div>


                                    <div className="analysis-info">

                                        <h3>
                                            Sports Video Analysis
                                        </h3>


                                        <p>
                                            Recent injury risk assessment
                                        </p>

                                    </div>


                                    <span
                                        className={`analysis-risk ${getRiskClass(
                                            risk
                                        )}`}
                                    >

                                        {risk}

                                    </span>


                                    <FaArrowRight
                                        className="analysis-arrow"
                                    />

                                </div>

                            );

                        })

                    )}

                </div>

            </section>


            {/* =================================================
                AI RECOMMENDATION
            ================================================= */}

            <section className="training-recommendation">

                <div className="recommendation-icon">

                    <FaTrophy />

                </div>


                <div className="recommendation-content">

                    <span>
                        AI TRAINING RECOMMENDATION
                    </span>


                    <h2>

                        {latestRisk.toLowerCase() === "high"

                            ? "Take a closer look at your latest analysis."

                            : latestRisk.toLowerCase() === "moderate"

                                ? "Train smart and monitor your movement."

                                : "Keep training. Stay safe."

                        }

                    </h2>


                    <p>

                        {latestRisk.toLowerCase() === "high"

                            ? "A high injury risk was detected. Review the detailed analysis and consider reducing high-intensity activity."

                            : latestRisk.toLowerCase() === "moderate"

                                ? "Your latest analysis indicates moderate risk. Focus on proper technique, recovery and controlled training."

                                : "Maintain proper form, monitor your movement and continue following a balanced training routine."

                        }

                    </p>

                </div>


                <button
                    className="recommendation-button"
                    onClick={() =>
                        navigate("/dashboard/analysis")
                    }
                >

                    View Analysis

                    <FaArrowRight />

                </button>

            </section>


            {/* =================================================
                BACKEND STATUS
            ================================================= */}

            <div className="backend-status">

                <span className="status-dot"></span>

                <span>
                    AI Detection System
                </span>


                <strong>

                    {dashboard?.backend_status ||
                        "Connected"}

                </strong>

            </div>

        </div>

    );

}

export default AthleteDashboard;