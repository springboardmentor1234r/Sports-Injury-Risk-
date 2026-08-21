import {
    Activity,
    AlertTriangle,
    BarChart3,
    ClipboardList,
    Search,
    ShieldCheck,
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


export default function CoachDashboard() {

    const username =
        localStorage.getItem("username") ||
        "Coach";


    const [stats, setStats] = useState({
        athletes: 0,
        analyses: 0,
        highRisk: 0,
        reports: 0,
    });


    const [athletes, setAthletes] =
        useState([]);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    useEffect(() => {
        loadCoachDashboard();
    }, []);


    const loadCoachDashboard = async () => {

        setLoading(true);
        setError("");

        try {

            const response =
                await api.get(
                    "/coach/dashboard"
                );


            const data =
                response?.data || {};


            setStats({
                athletes:
                    data.total_athletes ?? 0,

                analyses:
                    data.total_analysis ?? 0,

                highRisk:
                    data.high_risk_athletes ?? 0,

                reports:
                    data.total_reports ?? 0,
            });


            setAthletes(
                Array.isArray(
                    data.athletes
                )
                    ? data.athletes
                    : []
            );


        } catch (err) {

            console.error(
                "Coach dashboard loading failed:",
                err
            );


            /*
             * Keep the dashboard usable even if
             * the backend coach endpoint has not
             * been created yet.
             */

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
            title="Coach Dashboard"
        >

            <div className="dashboard-page">

                {/* =================================================
                    WELCOME
                ================================================= */}

                <section className="dashboard-welcome">

                    <div>

                        <p className="dashboard-eyebrow">
                            Coach Overview
                        </p>


                        <h2 className="dashboard-welcome-title">

                            Welcome back,{" "}
                            {username} 👋

                        </h2>


                        <p className="dashboard-welcome-description">

                            Monitor your athletes,
                            review movement analysis,
                            identify injury-risk patterns
                            and track performance.

                        </p>

                    </div>


                    <Link
                        to="/athletes"
                        className="dashboard-welcome-action"
                    >

                        <Users size={19} />

                        View Athletes

                    </Link>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="auth-error">

                        {error}

                    </div>

                )}


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <section
                    className="dashboard-stats-grid"
                    aria-label="Coach statistics"
                >

                    <CoachStatCard
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


                    <CoachStatCard
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


                    <CoachStatCard
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


                    <CoachStatCard
                        icon={
                            <BarChart3 size={24} />
                        }
                        title="Reports"
                        value={
                            loading
                                ? "..."
                                : stats.reports
                        }
                        accent="success"
                    />

                </section>


                {/* =================================================
                    QUICK ACTIONS
                ================================================= */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Coach Tools
                            </p>

                            <h2>
                                Quick Actions
                            </h2>

                        </div>

                    </div>


                    <div className="coach-actions-grid">

                        <Link
                            to="/athletes"
                            className="coach-action-card"
                        >

                            <div className="coach-action-icon">
                                <Users size={24} />
                            </div>

                            <div>

                                <h3>
                                    Manage Athletes
                                </h3>

                                <p>
                                    View athlete profiles
                                    and movement history.
                                </p>

                            </div>

                        </Link>


                        <Link
                            to="/analysis"
                            className="coach-action-card"
                        >

                            <div className="coach-action-icon">
                                <Activity size={24} />
                            </div>

                            <div>

                                <h3>
                                    Review Analysis
                                </h3>

                                <p>
                                    Review AI movement
                                    and biomechanics results.
                                </p>

                            </div>

                        </Link>


                        <Link
                            to="/reports"
                            className="coach-action-card"
                        >

                            <div className="coach-action-icon">
                                <ClipboardList
                                    size={24}
                                />
                            </div>

                            <div>

                                <h3>
                                    View Reports
                                </h3>

                                <p>
                                    Review injury-risk and
                                    performance reports.
                                </p>

                            </div>

                        </Link>


                        <Link
                            to="/chat"
                            className="coach-action-card"
                        >

                            <div className="coach-action-icon">
                                <Search size={24} />
                            </div>

                            <div>

                                <h3>
                                    Athlete Communication
                                </h3>

                                <p>
                                    Communicate with athletes
                                    and support staff.
                                </p>

                            </div>

                        </Link>

                    </div>

                </section>


                {/* =================================================
                    ATHLETE LIST
                ================================================= */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Team
                            </p>

                            <h2>
                                Athletes
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
                                        Analyses
                                    </th>

                                    <th>
                                        Risk
                                    </th>

                                    <th>
                                        Movement Quality
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {loading ? (

                                    <CoachLoadingRows />

                                ) : athletes.length > 0 ? (

                                    athletes.map(
                                        (athlete) => (

                                            <CoachAthleteRow
                                                key={
                                                    athlete.id ||
                                                    athlete.user_id ||
                                                    athlete.email
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

                                            No athletes
                                            available yet.

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* =================================================
                    COACH INSIGHT
                ================================================= */}

                <section className="dashboard-upload-card">

                    <div className="dashboard-upload-content">

                        <div className="dashboard-upload-icon">

                            <ShieldCheck
                                size={28}
                            />

                        </div>


                        <div>

                            <p className="dashboard-upload-eyebrow">
                                Injury Intelligence
                            </p>


                            <h2>
                                Coach Performance Monitoring
                            </h2>


                            <p>

                                Use athlete movement data,
                                biomechanical indicators and
                                injury-risk scores to identify
                                athletes who may require
                                additional attention.

                            </p>

                        </div>

                    </div>


                    <Link
                        to="/reports"
                        className="dashboard-upload-button"
                    >

                        <BarChart3 size={20} />

                        View Reports

                    </Link>

                </section>

            </div>

        </DashboardLayout>
    );
}


/* =========================================================
   COACH STAT CARD
========================================================= */

function CoachStatCard({
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
   ATHLETE ROW
========================================================= */

function CoachAthleteRow({
    athlete,
}) {

    const name =
        athlete.username ||
        athlete.name ||
        athlete.email ||
        "Athlete";


    const analyses =
        athlete.analyses ??
        athlete.total_analysis ??
        0;


    const risk =
        athlete.risk ??
        athlete.injury_risk ??
        athlete.current_risk;


    const movementQuality =
        athlete.movement_quality ??
        athlete.movementQuality;


    const normalizedRisk =
        typeof risk === "number"
            ? risk
            : null;


    let riskClass = "success";

    if (
        normalizedRisk !== null &&
        normalizedRisk >= 70
    ) {
        riskClass = "danger";
    } else if (
        normalizedRisk !== null &&
        normalizedRisk >= 40
    ) {
        riskClass = "warning";
    }


    return (

        <tr className="dashboard-table-row">

            <td>

                <div className="dashboard-video-name">

                    <div className="dashboard-video-icon">
                        <Users size={18} />
                    </div>

                    <span>
                        {name}
                    </span>

                </div>

            </td>


            <td>
                {analyses}
            </td>


            <td>

                <span
                    className={`dashboard-status ${riskClass}`}
                >

                    <span className="dashboard-status-dot" />

                    {risk !== undefined &&
                    risk !== null
                        ? `${risk}%`
                        : "--"}

                </span>

            </td>


            <td>

                {movementQuality !== undefined &&
                movementQuality !== null
                    ? `${movementQuality}%`
                    : "--"}

            </td>


            <td>

                <span className="dashboard-status success">

                    <span className="dashboard-status-dot" />

                    Active

                </span>

            </td>

        </tr>
    );
}


/* =========================================================
   LOADING ROWS
========================================================= */

function CoachLoadingRows() {

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

                            <div className="dashboard-table-skeleton status" />

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