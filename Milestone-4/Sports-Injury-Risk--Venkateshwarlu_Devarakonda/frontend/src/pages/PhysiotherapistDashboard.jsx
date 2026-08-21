import {
    Activity,
    AlertTriangle,
    ClipboardCheck,
    FileText,
    HeartPulse,
    Search,
    Users,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

export default function PhysiotherapistDashboard() {

    const username =
        localStorage.getItem("username") ||
        "Physiotherapist";

    const [stats, setStats] = useState({
        athletes: 0,
        assessments: 0,
        highRisk: 0,
        pendingReviews: 0,
    });

    const [athletes, setAthletes] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const config = {
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                },
            };

            /*
             * These endpoints will be connected
             * to the backend later.
             *
             * The frontend is intentionally prepared
             * for the physiotherapist workflow.
             */

            const response =
                await api.get(
                    "/physiotherapist/dashboard",
                    config
                );

            const data =
                response.data || {};

            setStats({
                athletes:
                    data.total_athletes ?? 0,

                assessments:
                    data.total_assessments ?? 0,

                highRisk:
                    data.high_risk_athletes ?? 0,

                pendingReviews:
                    data.pending_reviews ?? 0,
            });

            setAthletes(
                Array.isArray(
                    data.recent_athletes
                )
                    ? data.recent_athletes
                    : []
            );

        } catch (err) {

            console.error(
                "Physiotherapist dashboard loading failed:",
                err
            );

            /*
             * Backend dashboard endpoint may not exist
             * yet. Keep the UI usable instead of
             * breaking the complete dashboard.
             */

            setStats({
                athletes: 0,
                assessments: 0,
                highRisk: 0,
                pendingReviews: 0,
            });

            setAthletes([]);

            setError(
                err?.response?.data?.detail ||
                ""
            );

        } finally {

            setLoading(false);

        }
    };

    return (

        <DashboardLayout
            title="Physiotherapy Dashboard"
        >

            <div className="dashboard-page">

                {/* =====================================================
                    WELCOME
                ===================================================== */}

                <section className="dashboard-welcome">

                    <div>

                        <p className="dashboard-eyebrow">
                            Physiotherapy Overview
                        </p>

                        <h2 className="dashboard-welcome-title">
                            Welcome back,{" "}
                            {username} 👋
                        </h2>

                        <p className="dashboard-welcome-description">
                            Review athlete movement,
                            biomechanical findings,
                            injury-risk indicators and
                            rehabilitation progress.
                        </p>

                    </div>

                    <Link
                        to="/analysis"
                        className="dashboard-welcome-action"
                    >
                        <ClipboardCheck size={19} />

                        Review Assessments
                    </Link>

                </section>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (

                    <div className="dashboard-alert warning">

                        <AlertTriangle size={18} />

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                {/* =====================================================
                    STATISTICS
                ===================================================== */}

                <section
                    className="dashboard-stats-grid"
                    aria-label="Physiotherapy statistics"
                >

                    <DashboardStatCard
                        icon={
                            <Users size={24} />
                        }
                        title="Assigned Athletes"
                        value={
                            loading
                                ? "..."
                                : stats.athletes
                        }
                        accent="primary"
                    />


                    <DashboardStatCard
                        icon={
                            <ClipboardCheck
                                size={24}
                            />
                        }
                        title="Assessments"
                        value={
                            loading
                                ? "..."
                                : stats.assessments
                        }
                        accent="info"
                    />


                    <DashboardStatCard
                        icon={
                            <AlertTriangle
                                size={24}
                            />
                        }
                        title="High Risk"
                        value={
                            loading
                                ? "..."
                                : stats.highRisk
                        }
                        accent="risk"
                    />


                    <DashboardStatCard
                        icon={
                            <FileText size={24} />
                        }
                        title="Pending Reviews"
                        value={
                            loading
                                ? "..."
                                : stats.pendingReviews
                        }
                        accent="success"
                    />

                </section>


                {/* =====================================================
                    QUICK ACTIONS
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Clinical Workflow
                            </p>

                            <h2>
                                Quick Actions
                            </h2>

                        </div>

                    </div>


                    <div className="dashboard-quick-grid">

                        <QuickAction
                            icon={
                                <Users size={22} />
                            }
                            title="Athletes"
                            description="View assigned athlete profiles and movement history."
                            to="/athletes"
                        />


                        <QuickAction
                            icon={
                                <Activity size={22} />
                            }
                            title="Movement Analysis"
                            description="Review biomechanical measurements and movement quality."
                            to="/analysis"
                        />


                        <QuickAction
                            icon={
                                <HeartPulse size={22} />
                            }
                            title="Risk Assessments"
                            description="Review injury-risk indicators and abnormal movement patterns."
                            to="/reports"
                        />


                        <QuickAction
                            icon={
                                <ClipboardCheck size={22} />
                            }
                            title="Rehabilitation"
                            description="Track corrective exercises and rehabilitation recommendations."
                            to="/rehabilitation"
                        />

                    </div>

                </section>


                {/* =====================================================
                    ATHLETE REVIEWS
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Athlete Monitoring
                            </p>

                            <h2>
                                Recent Athlete Reviews
                            </h2>

                        </div>


                        <Link
                            to="/athletes"
                            className="dashboard-view-all"
                        >
                            View All
                        </Link>

                    </div>


                    <div className="dashboard-table-wrapper">

                        <table className="dashboard-table">

                            <thead>

                                <tr>

                                    <th>
                                        Athlete
                                    </th>

                                    <th>
                                        Risk
                                    </th>

                                    <th>
                                        Movement Quality
                                    </th>

                                    <th>
                                        Last Assessment
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {loading ? (

                                    <DashboardLoadingRows />

                                ) : athletes.length > 0 ? (

                                    athletes.map(
                                        (athlete) => (

                                            <AthleteRow
                                                key={
                                                    athlete.id
                                                }
                                                athlete={
                                                    athlete
                                                }
                                            />

                                        )
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            className="dashboard-empty"
                                        >
                                            No athlete
                                            assessments
                                            available yet.
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* =====================================================
                    CLINICAL NOTE
                ===================================================== */}

                <section className="dashboard-upload-card">

                    <div className="dashboard-upload-content">

                        <div className="dashboard-upload-icon">
                            <HeartPulse size={28} />
                        </div>

                        <div>

                            <p className="dashboard-upload-eyebrow">
                                Physiotherapy Intelligence
                            </p>

                            <h2>
                                Movement findings should
                                support clinical decisions
                            </h2>

                            <p>
                                Use AI-generated biomechanical
                                measurements as decision-support
                                information alongside clinical
                                assessment, athlete history and
                                professional judgement.
                            </p>

                        </div>

                    </div>

                    <Link
                        to="/reports"
                        className="dashboard-upload-button"
                    >
                        <FileText size={20} />

                        View Reports
                    </Link>

                </section>

            </div>

        </DashboardLayout>
    );
}


/* =========================================================
   STAT CARD
========================================================= */

function DashboardStatCard({
    icon,
    title,
    value,
    accent = "primary",
}) {

    return (

        <article
            className={`dashboard-stat-card ${accent}`}
        >

            <div className="dashboard-stat-top">

                <div className="dashboard-stat-icon">
                    {icon}
                </div>

            </div>

            <p className="dashboard-stat-title">
                {title}
            </p>

            <h3 className="dashboard-stat-value">
                {value}
            </h3>

        </article>
    );
}


/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
    icon,
    title,
    description,
    to,
}) {

    return (

        <Link
            to={to}
            className="dashboard-quick-card"
        >

            <div className="dashboard-quick-icon">
                {icon}
            </div>

            <div>

                <h3>
                    {title}
                </h3>

                <p>
                    {description}
                </p>

            </div>

        </Link>
    );
}


/* =========================================================
   ATHLETE ROW
========================================================= */

function AthleteRow({
    athlete,
}) {

    const risk =
        athlete.risk ??
        athlete.injury_risk ??
        "--";

    const movementQuality =
        athlete.movement_quality ??
        "--";

    const date =
        athlete.last_assessment ??
        athlete.assessed_at ??
        athlete.updated_at;

    const formattedDate = date
        ? new Date(date).toLocaleDateString(
            undefined,
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        )
        : "--";

    const athleteName =
        athlete.username ||
        athlete.name ||
        athlete.email ||
        "Athlete";

    const riskValue =
        typeof risk === "number"
            ? `${risk}%`
            : risk;

    return (

        <tr className="dashboard-table-row">

            <td>

                <div className="dashboard-video-name">

                    <div className="dashboard-video-icon">
                        <Users size={18} />
                    </div>

                    <span>
                        {athleteName}
                    </span>

                </div>

            </td>


            <td>

                <span
                    className={
                        `dashboard-risk-value ${
                            getRiskClass(risk)
                        }`
                    }
                >
                    {riskValue}
                </span>

            </td>


            <td>
                {typeof movementQuality === "number"
                    ? `${movementQuality}%`
                    : movementQuality}
            </td>


            <td>
                {formattedDate}
            </td>


            <td>

                <span className="dashboard-status success">

                    <span className="dashboard-status-dot" />

                    Reviewed

                </span>

            </td>

        </tr>
    );
}


/* =========================================================
   RISK CLASS
========================================================= */

function getRiskClass(risk) {

    const value =
        Number(risk);

    if (Number.isNaN(value)) {
        return "";
    }

    if (value >= 70) {
        return "high";
    }

    if (value >= 40) {
        return "medium";
    }

    return "low";
}


/* =========================================================
   LOADING ROWS
========================================================= */

function DashboardLoadingRows() {

    return (
        <>
            {[1, 2, 3].map(
                (item) => (

                    <tr
                        key={item}
                        className="dashboard-table-row"
                    >

                        <td>
                            <div className="dashboard-table-skeleton short" />
                        </td>

                        <td>
                            <div className="dashboard-table-skeleton medium" />
                        </td>

                        <td>
                            <div className="dashboard-table-skeleton medium" />
                        </td>

                        <td>
                            <div className="dashboard-table-skeleton medium" />
                        </td>

                        <td>
                            <div className="dashboard-table-skeleton status" />
                        </td>

                    </tr>

                )
            )}
        </>
    );
}