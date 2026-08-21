import {
    Activity,
    BarChart3,
    FileBarChart,
    History,
    MessageCircle,
    PlayCircle,
    ShieldCheck,
    Upload,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
    useEffect,
    useState,
} from "react";

import api from "../services/api";

import DashboardLayout from "../components/DashboardLayout";


/*
|--------------------------------------------------------------------------
| Athlete Dashboard
|--------------------------------------------------------------------------
|
| API endpoints used:
|
| GET /video/dashboard
| GET /video/history
| GET /injury/history
|
| The dashboard does NOT use hard-coded statistics.
| All displayed values come from the backend.
|
|--------------------------------------------------------------------------
*/


export default function AthleteDashboard() {

    const username =
        localStorage.getItem("username") ||
        "Athlete";


    /*
    |--------------------------------------------------------------------------
    | Dashboard State
    |--------------------------------------------------------------------------
    */

    const [stats, setStats] = useState({
        videos: 0,
        analyses: 0,
        risk: "--",
        averageRisk: null,
        movementQuality: null,
        balanceScore: null,
        symmetryScore: null,
        rangeOfMotion: null,
        bodyPart: "--",
        riskLevel: "--",
        reportStatus: "--",
    });


    const [
        recentVideos,
        setRecentVideos,
    ] = useState([]);


    const [
        latestReport,
        setLatestReport,
    ] = useState(null);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Load Dashboard
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        loadDashboard();

    }, []);


    const loadDashboard = async () => {

        try {

            setLoading(true);
            setError("");


            /*
            |--------------------------------------------------------------------------
            | Fetch all dashboard data
            |--------------------------------------------------------------------------
            */

            const [
                dashboardResponse,
                historyResponse,
                injuryResponse,
            ] = await Promise.all([

                api.get(
                    "/video/dashboard"
                ),

                api.get(
                    "/video/history"
                ),

                api.get(
                    "/injury/history"
                ),

            ]);


            /*
            |--------------------------------------------------------------------------
            | Backend Responses
            |--------------------------------------------------------------------------
            */

            const dashboard =
                dashboardResponse?.data || {};


            const history =
                Array.isArray(
                    historyResponse?.data
                )
                    ? historyResponse.data
                    : [];


            const injuries =
                Array.isArray(
                    injuryResponse?.data
                )
                    ? injuryResponse.data
                    : [];


            /*
            |--------------------------------------------------------------------------
            | Latest Injury Report
            |--------------------------------------------------------------------------
            |
            | Your backend returns the newest report first.
            |
            | Example:
            |
            | id: 33
            | injury_risk: 39.16
            | risk_level: Low
            | movement_quality: 92.34
            |
            |--------------------------------------------------------------------------
            */

            const newestReport =
                injuries.length > 0
                    ? injuries[0]
                    : null;


            setLatestReport(
                newestReport
            );


            /*
            |--------------------------------------------------------------------------
            | Dashboard Statistics
            |--------------------------------------------------------------------------
            */

            setStats({

                videos:
                    dashboard.total_uploads ??
                    0,


                analyses:
                    dashboard.total_analysis ??
                    0,


                /*
                | Backend returns:
                |
                | current_risk: "Low"
                |
                | So we display "Low", not "Low%".
                */

                risk:
                    dashboard.current_risk ??
                    newestReport?.risk_level ??
                    "--",


                averageRisk:
                    dashboard.average_risk_score ??
                    null,


                movementQuality:
                    newestReport?.movement_quality ??
                    null,


                balanceScore:
                    newestReport?.balance_score ??
                    null,


                symmetryScore:
                    newestReport?.symmetry_score ??
                    null,


                rangeOfMotion:
                    newestReport?.range_of_motion ??
                    null,


                bodyPart:
                    newestReport?.body_part ??
                    "--",


                riskLevel:
                    newestReport?.risk_level ??
                    dashboard.current_risk ??
                    "--",


                reportStatus:
                    newestReport?.status ??
                    "--",

            });


            /*
            |--------------------------------------------------------------------------
            | Recent Videos
            |--------------------------------------------------------------------------
            |
            | Backend already returns history.
            | We only show the newest 5.
            |
            |--------------------------------------------------------------------------
            */

            setRecentVideos(
                history.slice(0, 5)
            );


        } catch (requestError) {

            console.error(
                "Athlete dashboard loading failed:",
                requestError
            );


            /*
            |--------------------------------------------------------------------------
            | Friendly Error
            |--------------------------------------------------------------------------
            */

            const backendMessage =
                requestError?.response?.data?.detail;


            setError(
                backendMessage ||
                "Unable to load dashboard data. Please try again."
            );


        } finally {

            setLoading(false);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | Refresh Dashboard
    |--------------------------------------------------------------------------
    */

    const handleRefresh = () => {

        loadDashboard();

    };


    /*
    |--------------------------------------------------------------------------
    | Format Number
    |--------------------------------------------------------------------------
    */

    const formatNumber = (
        value,
        decimals = 2
    ) => {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "--";

        }


        const number =
            Number(value);


        if (
            Number.isNaN(number)
        ) {

            return value;

        }


        return number.toFixed(
            decimals
        );

    };


    /*
    |--------------------------------------------------------------------------
    | Format Percentage
    |--------------------------------------------------------------------------
    */

    const formatPercentage = (
        value
    ) => {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "--";

        }


        const number =
            Number(value);


        if (
            Number.isNaN(number)
        ) {

            return value;

        }


        return `${number.toFixed(2)}%`;

    };


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (

        <DashboardLayout
            title="Athlete Dashboard"
        >

            <div className="dashboard-page">


                {/* =====================================================
                    WELCOME
                ===================================================== */}

                <section className="dashboard-welcome">

                    <div>

                        <p className="dashboard-eyebrow">
                            Athlete Overview
                        </p>


                        <h2 className="dashboard-welcome-title">

                            Welcome back,{" "}

                            {username}

                            {" "}👋

                        </h2>


                        <p className="dashboard-welcome-description">

                            Monitor your movement,
                            injury risk and
                            performance from
                            one intelligent
                            dashboard.

                        </p>

                    </div>


                    <div className="dashboard-welcome-actions">

                        <button
                            type="button"
                            className="dashboard-refresh-button"
                            onClick={handleRefresh}
                            disabled={loading}
                        >

                            <Activity
                                size={18}
                            />

                            {loading
                                ? "Refreshing..."
                                : "Refresh"
                            }

                        </button>


                        <Link
                            to="/upload"
                            className="dashboard-welcome-action"
                        >

                            <Upload
                                size={19}
                            />

                            Analyze New Video

                        </Link>

                    </div>

                </section>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (

                    <div
                        className="auth-error"
                        role="alert"
                    >

                        {error}

                    </div>

                )}


                {/* =====================================================
                    MAIN STATISTICS
                ===================================================== */}

                <section
                    className="dashboard-stats-grid"
                    aria-label="Athlete statistics"
                >

                    <DashboardStatCard
                        icon={
                            <Upload size={24} />
                        }
                        title="Videos Uploaded"
                        value={
                            loading
                                ? "..."
                                : stats.videos
                        }
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
                    />


                    <DashboardStatCard
                        icon={
                            <ShieldCheck size={24} />
                        }
                        title="Current Risk"
                        value={
                            loading
                                ? "..."
                                : stats.risk
                        }
                        accent="risk"
                    />


                    <DashboardStatCard
                        icon={
                            <Activity size={24} />
                        }
                        title="Movement Quality"
                        value={
                            loading
                                ? "..."
                                : formatPercentage(
                                    stats.movementQuality
                                )
                        }
                        accent="success"
                    />


                    <DashboardStatCard
                        icon={
                            <FileBarChart size={24} />
                        }
                        title="Average Risk Score"
                        value={
                            loading
                                ? "..."
                                : formatPercentage(
                                    stats.averageRisk
                                )
                        }
                        accent="info"
                    />

                </section>


                {/* =====================================================
                    LATEST RISK OVERVIEW
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                AI Risk Assessment
                            </p>


                            <h2>
                                Latest Injury Risk
                            </h2>


                            <p className="dashboard-section-description">

                                Based on your latest available
                                injury assessment.

                            </p>

                        </div>


                        <Link
                            to="/reports"
                            className="dashboard-view-all"
                        >

                            View Reports

                        </Link>

                    </div>


                    <div className="injury-overview-grid">


                        <RiskOverviewItem
                            label="Risk Score"
                            value={
                                loading
                                    ? "..."
                                    : formatPercentage(
                                        latestReport?.injury_risk
                                    )
                            }
                            type="risk"
                        />


                        <RiskOverviewItem
                            label="Risk Level"
                            value={
                                loading
                                    ? "..."
                                    : latestReport?.risk_level ||
                                      "--"
                            }
                            type="level"
                        />


                        <RiskOverviewItem
                            label="Affected Area"
                            value={
                                loading
                                    ? "..."
                                    : latestReport?.body_part ||
                                      "--"
                            }
                        />


                        <RiskOverviewItem
                            label="Report Status"
                            value={
                                loading
                                    ? "..."
                                    : latestReport?.status ||
                                      "--"
                            }
                        />

                    </div>

                </section>


                {/* =====================================================
                    MOVEMENT METRICS
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Latest AI Assessment
                            </p>


                            <h2>
                                Movement Metrics
                            </h2>


                            <p className="dashboard-section-description">

                                Latest biomechanics measurements
                                from your movement analysis.

                            </p>

                        </div>

                    </div>


                    <div className="movement-metrics-grid">

                        <MovementMetric
                            label="Movement Quality"
                            value={
                                stats.movementQuality
                            }
                            suffix="%"
                            loading={loading}
                        />


                        <MovementMetric
                            label="Balance Score"
                            value={
                                stats.balanceScore
                            }
                            suffix="%"
                            loading={loading}
                        />


                        <MovementMetric
                            label="Symmetry Score"
                            value={
                                stats.symmetryScore
                            }
                            suffix="%"
                            loading={loading}
                        />


                        <MovementMetric
                            label="Range of Motion"
                            value={
                                stats.rangeOfMotion
                            }
                            suffix="°"
                            loading={loading}
                        />

                    </div>

                </section>


                {/* =====================================================
                    QUICK ACTIONS
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Quick Actions
                            </p>


                            <h2>
                                Athlete Tools
                            </h2>

                        </div>

                    </div>


                    <div className="dashboard-quick-actions">

                        <QuickAction
                            to="/upload"
                            icon={
                                <Upload size={22} />
                            }
                            title="Upload Video"
                            description="Analyze a new sports movement video."
                        />


                        <QuickAction
                            to="/history"
                            icon={
                                <History size={22} />
                            }
                            title="Upload History"
                            description="Review your previous video analyses."
                        />


                        <QuickAction
                            to="/analysis"
                            icon={
                                <Activity size={22} />
                            }
                            title="View Analysis"
                            description="Review your latest movement analysis."
                        />


                        <QuickAction
                            to="/reports"
                            icon={
                                <BarChart3 size={22} />
                            }
                            title="Reports"
                            description="View detailed injury-risk reports."
                        />


                        <QuickAction
                            to="/chat"
                            icon={
                                <MessageCircle size={22} />
                            }
                            title="Professional Chat"
                            description="Talk with your coach or healthcare professional."
                        />

                    </div>

                </section>


                {/* =====================================================
                    AI ANALYSIS CTA
                ===================================================== */}

                <section className="dashboard-upload-card">

                    <div className="dashboard-upload-content">

                        <div className="dashboard-upload-icon">

                            <PlayCircle
                                size={28}
                            />

                        </div>


                        <div>

                            <p className="dashboard-upload-eyebrow">
                                AI Movement Analysis
                            </p>


                            <h2>
                                Analyze a New Video
                            </h2>


                            <p>

                                Upload a sports
                                movement video
                                and receive
                                AI-powered
                                biomechanics,
                                pose estimation
                                and injury-risk
                                analysis.

                            </p>

                        </div>

                    </div>


                    <Link
                        to="/upload"
                        className="dashboard-upload-button"
                    >

                        <PlayCircle
                            size={20}
                        />

                        Upload Video

                    </Link>

                </section>


                {/* =====================================================
                    RECENT UPLOADS
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Activity
                            </p>


                            <h2>
                                Recent Uploads
                            </h2>

                        </div>


                        <Link
                            to="/history"
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
                                        Video Name
                                    </th>

                                    <th>
                                        Uploaded On
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {loading ? (

                                    <DashboardLoadingRows />

                                ) : recentVideos.length > 0 ? (

                                    recentVideos.map(
                                        (
                                            video,
                                            index
                                        ) => (

                                            <DashboardVideoRow
                                                key={
                                                    video.id ??
                                                    video.video_id ??
                                                    index
                                                }

                                                video={
                                                    video.filename ||
                                                    video.file_name ||
                                                    video.name ||
                                                    `Video #${
                                                        video.id ??
                                                        index + 1
                                                    }`
                                                }

                                                date={
                                                    video.uploaded_at ||
                                                    video.created_at ||
                                                    video.createdAt
                                                }

                                                status={
                                                    video.status ||
                                                    "Completed"
                                                }

                                            />

                                        )
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="3"
                                            className="dashboard-empty"
                                        >

                                            No uploaded
                                            videos found.

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* =====================================================
                    LATEST RECOMMENDATION
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                AI Recommendation
                            </p>


                            <h2>
                                Latest Assessment
                            </h2>

                        </div>


                        <Link
                            to="/reports"
                            className="dashboard-view-all"
                        >

                            Full Report

                        </Link>

                    </div>


                    <div className="dashboard-recommendation">

                        <div className="dashboard-recommendation-icon">

                            <ShieldCheck
                                size={24}
                            />

                        </div>


                        <div>

                            <h3>

                                {loading
                                    ? "Loading assessment..."
                                    : latestReport?.body_part
                                        ? `${latestReport.body_part} Assessment`
                                        : "Movement Assessment"
                                }

                            </h3>


                            <p>

                                {loading
                                    ? "Please wait while your latest AI assessment is loaded."
                                    : latestReport?.recommendation ||
                                      "No recommendation is available yet."
                                }

                            </p>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    PROFESSIONAL SUPPORT
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Professional Support
                            </p>


                            <h2>
                                Connect With Your Team
                            </h2>


                            <p className="dashboard-section-description">

                                Communicate with coaches,
                                physiotherapists and sports
                                scientists through SportSense AI.

                            </p>

                        </div>


                        <Link
                            to="/chat"
                            className="dashboard-view-all"
                        >

                            Open Chat

                        </Link>

                    </div>


                    <div className="dashboard-professional-grid">

                        <ProfessionalCard
                            title="Coach"
                            description="Discuss training, performance and movement."
                        />


                        <ProfessionalCard
                            title="Physiotherapist"
                            description="Discuss injury-risk findings and recovery."
                        />


                        <ProfessionalCard
                            title="Sports Scientist"
                            description="Review detailed biomechanics and performance data."
                        />

                    </div>

                </section>

            </div>

        </DashboardLayout>

    );

}


/*
|--------------------------------------------------------------------------
| Dashboard Stat Card
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Risk Overview Item
|--------------------------------------------------------------------------
*/

function RiskOverviewItem({
    label,
    value,
    type = "",
}) {

    return (

        <div
            className={`injury-overview-item ${type}`}
        >

            <span className="injury-overview-label">

                {label}

            </span>


            <strong className="injury-overview-value">

                {value}

            </strong>

        </div>

    );

}


/*
|--------------------------------------------------------------------------
| Movement Metric
|--------------------------------------------------------------------------
*/

function MovementMetric({
    label,
    value,
    suffix,
    loading,
}) {

    return (

        <div className="movement-metric">

            <span className="movement-metric-label">

                {label}

            </span>


            <strong className="movement-metric-value">

                {loading
                    ? "..."
                    : value !== null &&
                      value !== undefined &&
                      value !== ""
                        ? `${formatMetricValue(value)}${suffix}`
                        : "--"
                }

            </strong>

        </div>

    );

}


/*
|--------------------------------------------------------------------------
| Format Metric Value
|--------------------------------------------------------------------------
*/

function formatMetricValue(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return value;

    }


    return number.toFixed(2);

}


/*
|--------------------------------------------------------------------------
| Quick Action
|--------------------------------------------------------------------------
*/

function QuickAction({
    to,
    icon,
    title,
    description,
}) {

    return (

        <Link
            to={to}
            className="dashboard-quick-action"
        >

            <div className="dashboard-quick-action-icon">

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


/*
|--------------------------------------------------------------------------
| Video Row
|--------------------------------------------------------------------------
*/

function DashboardVideoRow({
    video,
    date,
    status,
}) {

    const formattedDate = date
        ? formatDate(date)
        : "--";


    const normalizedStatus =
        String(
            status ||
            "Completed"
        ).toLowerCase();


    const statusClass =
        normalizedStatus.includes("fail") ||
        normalizedStatus.includes("error")
            ? "error"
            : normalizedStatus.includes("process") ||
              normalizedStatus.includes("pending")
                ? "processing"
                : "success";


    return (

        <tr className="dashboard-table-row">

            <td>

                <div className="dashboard-video-name">

                    <div className="dashboard-video-icon">

                        <PlayCircle
                            size={18}
                        />

                    </div>


                    <span>
                        {video}
                    </span>

                </div>

            </td>


            <td>

                {formattedDate}

            </td>


            <td>

                <span
                    className={`dashboard-status ${statusClass}`}
                >

                    <span className="dashboard-status-dot" />

                    {status}

                </span>

            </td>

        </tr>

    );

}


/*
|--------------------------------------------------------------------------
| Format Date
|--------------------------------------------------------------------------
*/

function formatDate(
    date
) {

    try {

        const parsedDate =
            new Date(date);


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {

            return "--";

        }


        return parsedDate.toLocaleDateString(
            undefined,
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );

    } catch {

        return "--";

    }

}


/*
|--------------------------------------------------------------------------
| Professional Card
|--------------------------------------------------------------------------
*/

function ProfessionalCard({
    title,
    description,
}) {

    return (

        <Link
            to="/chat"
            className="dashboard-professional-card"
        >

            <div className="dashboard-professional-icon">

                <MessageCircle
                    size={20}
                />

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


/*
|--------------------------------------------------------------------------
| Loading Rows
|--------------------------------------------------------------------------
*/

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

                            <div className="dashboard-table-skeleton status" />

                        </td>

                    </tr>

                )
            )}

        </>

    );

}