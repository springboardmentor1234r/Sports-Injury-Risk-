import {
    Activity,
    BarChart3,
    Brain,
    ClipboardCheck,
    FileBarChart,
    FlaskConical,
    TrendingUp,
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

export default function SportsScientistDashboard() {

    const username =
        localStorage.getItem("username") ||
        "Sports Scientist";

    const [stats, setStats] = useState({
        athletes: 0,
        analyses: 0,
        avgMovementQuality: "--",
        avgRisk: "--",
        datasets: 0,
    });

    const [athletes, setAthletes] =
        useState([]);

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
             * Backend endpoint will be implemented
             * during the backend phase.
             */

            const response =
                await api.get(
                    "/sports-scientist/dashboard",
                    config
                );

            const data =
                response.data || {};

            setStats({
                athletes:
                    data.total_athletes ?? 0,

                analyses:
                    data.total_analyses ?? 0,

                avgMovementQuality:
                    data.average_movement_quality ??
                    "--",

                avgRisk:
                    data.average_injury_risk ??
                    "--",

                datasets:
                    data.total_datasets ?? 0,
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
                "Sports Scientist dashboard loading failed:",
                err
            );

            setStats({
                athletes: 0,
                analyses: 0,
                avgMovementQuality: "--",
                avgRisk: "--",
                datasets: 0,
            });

            setAthletes([]);

            /*
             * Do not make the frontend crash if
             * the backend endpoint isn't available yet.
             */

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
            title="Sports Scientist Dashboard"
        >

            <div className="dashboard-page">

                {/* =====================================================
                    WELCOME
                ===================================================== */}

                <section className="dashboard-welcome">

                    <div>

                        <p className="dashboard-eyebrow">
                            Sports Science Intelligence
                        </p>

                        <h2 className="dashboard-welcome-title">
                            Welcome back,{" "}
                            {username} 👋
                        </h2>

                        <p className="dashboard-welcome-description">
                            Analyze athlete movement,
                            biomechanics, performance
                            trends and injury-risk
                            indicators using data-driven
                            sports intelligence.
                        </p>

                    </div>

                    <Link
                        to="/analysis"
                        className="dashboard-welcome-action"
                    >

                        <BarChart3 size={19} />

                        Explore Analytics

                    </Link>

                </section>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (

                    <div className="dashboard-alert warning">

                        <Activity size={18} />

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
                    aria-label="Sports science statistics"
                >

                    <DashboardStatCard
                        icon={
                            <Users size={24} />
                        }
                        title="Athletes"
                        value={
                            loading
                                ? "..."
                                : stats.athletes
                        }
                        accent="primary"
                    />


                    <DashboardStatCard
                        icon={
                            <Activity size={24} />
                        }
                        title="AI Analyses"
                        value={
                            loading
                                ? "..."
                                : stats.analyses
                        }
                        accent="info"
                    />


                    <DashboardStatCard
                        icon={
                            <TrendingUp size={24} />
                        }
                        title="Avg Movement Quality"
                        value={
                            loading
                                ? "..."
                                : stats.avgMovementQuality !==
                                  "--"
                                    ? `${stats.avgMovementQuality}%`
                                    : "--"
                        }
                        accent="success"
                    />


                    <DashboardStatCard
                        icon={
                            <Brain size={24} />
                        }
                        title="Avg Injury Risk"
                        value={
                            loading
                                ? "..."
                                : stats.avgRisk !==
                                  "--"
                                    ? `${stats.avgRisk}%`
                                    : "--"
                        }
                        accent="risk"
                    />


                    <DashboardStatCard
                        icon={
                            <FlaskConical
                                size={24}
                            />
                        }
                        title="Datasets"
                        value={
                            loading
                                ? "..."
                                : stats.datasets
                        }
                        accent="primary"
                    />

                </section>


                {/* =====================================================
                    ANALYTICS ACTIONS
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Performance Intelligence
                            </p>

                            <h2>
                                Analytics & Research
                            </h2>

                        </div>

                    </div>


                    <div className="dashboard-quick-grid">

                        <QuickAction
                            icon={
                                <BarChart3 size={22} />
                            }
                            title="Performance Analytics"
                            description="Study athlete performance, movement quality and progression trends."
                            to="/analytics"
                        />


                        <QuickAction
                            icon={
                                <Activity size={22} />
                            }
                            title="Movement Analysis"
                            description="Inspect joint angles, balance, symmetry and biomechanical measurements."
                            to="/analysis"
                        />


                        <QuickAction
                            icon={
                                <Brain size={22} />
                            }
                            title="Risk Intelligence"
                            description="Compare injury-risk indicators across athletes and movement sessions."
                            to="/reports"
                        />


                        <QuickAction
                            icon={
                                <FlaskConical size={22} />
                            }
                            title="Research Data"
                            description="Work with structured movement and performance datasets."
                            to="/datasets"
                        />

                    </div>

                </section>


                {/* =====================================================
                    ATHLETE PERFORMANCE
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Athlete Performance
                            </p>

                            <h2>
                                Recent Athlete Data
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
                                        Movement Quality
                                    </th>

                                    <th>
                                        Injury Risk
                                    </th>

                                    <th>
                                        Analyses
                                    </th>

                                    <th>
                                        Last Updated
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {loading ? (

                                    <DashboardLoadingRows />

                                ) : athletes.length > 0 ? (

                                    athletes.map(
                                        (athlete) => (

                                            <AthletePerformanceRow
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
                                            performance data
                                            available yet.
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* =====================================================
                    RESEARCH / REPORT CTA
                ===================================================== */}

                <section className="dashboard-upload-card">

                    <div className="dashboard-upload-content">

                        <div className="dashboard-upload-icon">

                            <FileBarChart
                                size={28}
                            />

                        </div>

                        <div>

                            <p className="dashboard-upload-eyebrow">
                                Sports Science Reports
                            </p>

                            <h2>
                                Generate Performance Insights
                            </h2>

                            <p>
                                Combine movement metrics,
                                biomechanical measurements
                                and injury-risk indicators
                                into structured performance
                                reports.
                            </p>

                        </div>

                    </div>


                    <Link
                        to="/reports"
                        className="dashboard-upload-button"
                    >

                        <ClipboardCheck size={20} />

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
   ATHLETE PERFORMANCE ROW
========================================================= */

function AthletePerformanceRow({
    athlete,
}) {

    const movementQuality =
        athlete.movement_quality ??
        athlete.movementQuality ??
        "--";

    const risk =
        athlete.injury_risk ??
        athlete.risk ??
        "--";

    const analyses =
        athlete.analysis_count ??
        athlete.analyses ??
        0;

    const date =
        athlete.updated_at ??
        athlete.last_assessment ??
        athlete.last_analysis;

    const athleteName =
        athlete.username ||
        athlete.name ||
        athlete.email ||
        "Athlete";

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

    const movementValue =
        typeof movementQuality === "number"
            ? `${movementQuality}%`
            : movementQuality;

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

                <span className="dashboard-performance-value">

                    {movementValue}

                </span>

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
                {analyses}
            </td>


            <td>
                {formattedDate}
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
                            <div className="dashboard-table-skeleton short" />
                        </td>

                        <td>
                            <div className="dashboard-table-skeleton medium" />
                        </td>

                    </tr>

                )
            )}
        </>
    );
}