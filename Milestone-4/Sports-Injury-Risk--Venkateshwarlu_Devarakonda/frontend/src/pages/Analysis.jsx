import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    Activity,
    ArrowLeft,
    RefreshCw,
    Eye,
    Play,
    Video,
    Clock3,
    Gauge,
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Target,
    Dumbbell,
    Brain,
    BarChart3,
    Download,
    Info,
} from "lucide-react";

import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";


/* =========================================================
   HELPERS
========================================================= */

const getNumber = (value, fallback = 0) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
};


const formatNumber = (value, decimals = 2) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "--";
    }

    return number.toFixed(decimals);
};


const formatDate = (value) => {

    if (!value) {
        return "--";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return date.toLocaleString();
};


const getRiskColor = (score) => {

    const value = getNumber(score);

    if (value >= 70) {
        return "red";
    }

    if (value >= 40) {
        return "yellow";
    }

    return "green";
};


const getStatusColor = (status) => {

    const value = String(status || "").toLowerCase();

    if (
        value.includes("excellent") ||
        value.includes("normal") ||
        value.includes("low")
    ) {
        return "green";
    }

    if (
        value.includes("moderate") ||
        value.includes("slight")
    ) {
        return "yellow";
    }

    if (
        value.includes("high") ||
        value.includes("severe") ||
        value.includes("critical")
    ) {
        return "red";
    }

    return "blue";
};


const colorClasses = {
    green: {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        bar: "bg-emerald-500",
    },

    yellow: {
        text: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        bar: "bg-yellow-500",
    },

    red: {
        text: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        bar: "bg-red-500",
    },

    blue: {
        text: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        bar: "bg-blue-500",
    },

    purple: {
        text: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        bar: "bg-purple-500",
    },
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Analysis() {

    const navigate = useNavigate();

    const { videoId } = useParams();


    /* =====================================================
       ALL HOOKS MUST STAY HERE
       NEVER PUT HOOKS BELOW CONDITIONAL RETURNS
    ===================================================== */

    const [videos, setVideos] = useState([]);

    const [video, setVideo] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    /* =====================================================
       LOAD OVERVIEW
    ===================================================== */

    const loadAnalyses = async () => {

        try {

            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }


            const response = await api.get(
                "/video/history",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );


            console.log(
                "History API response:",
                response.data
            );


            let data = [];


            if (Array.isArray(response.data)) {

                data = response.data;

            } else if (
                Array.isArray(response.data?.videos)
            ) {

                data = response.data.videos;

            } else if (
                Array.isArray(response.data?.history)
            ) {

                data = response.data.history;
            }


            /*
                Keep videos that appear to have analysis.

                Your backend may expose different field names,
                so we support several possibilities.
            */

            const analyses = data.filter(
                (item) => {

                    return (
                        item?.has_analysis === true ||
                        item?.hasAnalysis === true ||
                        item?.risk_level !== null &&
                        item?.risk_level !== undefined ||
                        item?.risk_score !== null &&
                        item?.risk_score !== undefined
                    );
                }
            );


            setVideos(analyses);


        } catch (err) {

            console.error(
                "Failed to load analyses:",
                err
            );


            if (
                err?.response?.status === 401
            ) {

                localStorage.clear();

                navigate("/login");

                return;
            }


            setError(
                err?.response?.data?.detail ||
                "Unable to load analyses."
            );


        } finally {

            setLoading(false);
        }
    };


    /* =====================================================
       LOAD SINGLE ANALYSIS
    ===================================================== */

    const loadAnalysis = async () => {

        try {

            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");


            if (!token) {

                navigate("/login");

                return;
            }


            const response = await api.get(
                `/video/analysis/${videoId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );


            console.log(
                "Analysis API response:",
                response.data
            );


            setVideo(response.data);


        } catch (err) {

            console.error(
                "Failed to load analysis:",
                err
            );


            if (
                err?.response?.status === 401
            ) {

                localStorage.clear();

                navigate("/login");

                return;
            }


            setError(
                err?.response?.data?.detail ||
                "Unable to load analysis."
            );


        } finally {

            setLoading(false);
        }
    };


    /* =====================================================
       ONE EFFECT
    ===================================================== */

    useEffect(() => {

        if (videoId) {

            loadAnalysis();

        } else {

            loadAnalyses();
        }

    }, [videoId]);


    /* =====================================================
       OVERVIEW PAGE
    ===================================================== */

    if (!videoId) {

        return (

            <DashboardLayout title="Analysis">

                <div className="space-y-8">


                    {/* HEADER */}

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                        <div>

                            <div className="flex items-center gap-3">

                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">

                                    <Activity
                                        size={26}
                                        className="text-purple-400"
                                    />

                                </div>


                                <div>

                                    <h1 className="text-4xl font-bold text-white">
                                        Analysis
                                    </h1>

                                    <p className="text-gray-400 mt-1">
                                        AI-powered sports injury and biomechanics analysis.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <button
                            onClick={loadAnalyses}
                            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition"
                        >

                            <RefreshCw size={18} />

                            Refresh

                        </button>

                    </div>


                    {/* LOADING */}

                    {loading && (

                        <LoadingCard
                            text="Loading analysis history..."
                        />

                    )}


                    {/* ERROR */}

                    {!loading && error && (

                        <ErrorCard
                            error={error}
                            onRetry={loadAnalyses}
                        />

                    )}


                    {/* EMPTY */}

                    {!loading &&
                        !error &&
                        videos.length === 0 && (

                            <div className="bg-white/5 border border-white/10 rounded-3xl p-14 text-center">

                                <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 flex items-center justify-center">

                                    <Activity
                                        size={42}
                                        className="text-purple-400"
                                    />

                                </div>


                                <h2 className="text-2xl font-bold mt-6">
                                    No Analyses Available
                                </h2>


                                <p className="text-gray-400 mt-3 max-w-md mx-auto">
                                    Upload a sports movement video to generate AI-powered biomechanics and injury-risk analysis.
                                </p>


                                <button
                                    onClick={() =>
                                        navigate("/upload")
                                    }
                                    className="mt-7 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition"
                                >
                                    Upload Video
                                </button>

                            </div>

                        )}


                    {/* ANALYSIS CARDS */}

                    {!loading &&
                        !error &&
                        videos.length > 0 && (

                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

                                {videos.map((item) => {

                                    const id =
                                        item?.id ??
                                        item?.video_id ??
                                        item?.videoId;


                                    const riskScore =
                                        item?.risk_score ??
                                        item?.riskScore;


                                    const riskLevel =
                                        item?.risk_level ??
                                        item?.riskLevel ??
                                        "Unknown";


                                    const riskColor =
                                        getRiskColor(
                                            riskScore
                                        );


                                    const colors =
                                        colorClasses[
                                            riskColor
                                        ];


                                    return (

                                        <div
                                            key={id}
                                            className="group bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-purple-500/40 hover:bg-white/[0.07] transition duration-300"
                                        >

                                            <div className="flex items-start justify-between">

                                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">

                                                    <Activity
                                                        size={25}
                                                        className="text-purple-400"
                                                    />

                                                </div>


                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
                                                >
                                                    {riskLevel}
                                                </span>

                                            </div>


                                            <h2 className="text-xl font-bold mt-5 break-words text-white">

                                                {item?.filename ||
                                                    "Unknown Video"}

                                            </h2>


                                            <p className="text-gray-500 text-sm mt-2">

                                                {formatDate(
                                                    item?.uploaded_at
                                                )}

                                            </p>


                                            {/* RISK */}

                                            <div className="mt-6">

                                                <div className="flex justify-between items-end">

                                                    <div>

                                                        <p className="text-gray-500 text-xs uppercase tracking-wider">
                                                            Risk Score
                                                        </p>

                                                        <p className="text-3xl font-bold mt-1">

                                                            {riskScore !==
                                                                null &&
                                                            riskScore !==
                                                                undefined
                                                                ? `${formatNumber(
                                                                    riskScore
                                                                )}%`
                                                                : "--"}

                                                        </p>

                                                    </div>


                                                    <ShieldAlert
                                                        size={25}
                                                        className={
                                                            colors.text
                                                        }
                                                    />

                                                </div>


                                                <div className="h-2 bg-white/10 rounded-full mt-4 overflow-hidden">

                                                    <div
                                                        className={`h-full ${colors.bar} rounded-full transition-all`}
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                Math.max(
                                                                    0,
                                                                    getNumber(
                                                                        riskScore
                                                                    )
                                                                )
                                                            )}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>


                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/analysis/${id}`
                                                    )
                                                }
                                                className="w-full mt-7 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition"
                                            >

                                                <Eye size={18} />

                                                View Full Analysis

                                            </button>

                                        </div>

                                    );

                                })}

                            </div>

                        )}

                </div>

            </DashboardLayout>
        );
    }


    /* =====================================================
       SINGLE ANALYSIS LOADING
    ===================================================== */

    if (loading) {

        return (

            <DashboardLayout title="Analysis">

                <LoadingCard
                    text="Running analysis dashboard..."
                />

            </DashboardLayout>
        );
    }


    /* =====================================================
       SINGLE ANALYSIS ERROR
    ===================================================== */

    if (error) {

        return (

            <DashboardLayout title="Analysis">

                <ErrorCard
                    error={error}
                    onRetry={loadAnalysis}
                    onBack={() =>
                        navigate("/analysis")
                    }
                />

            </DashboardLayout>
        );
    }


    /* =====================================================
       SAFE DATA EXTRACTION
    ===================================================== */

    const analysis =
        video?.analysis || {};


    const risk =
        analysis?.risk_analysis || {};


    const biomechanics =
        analysis?.biomechanics || {};


    const injuryPrediction =
        analysis?.injury_prediction || {};


    const recommendations =
        analysis?.recommendations || {};


    const anomalyDetection =
        analysis?.anomaly_detection || {};


    const jointAngles =
        analysis?.joint_angles || {};


    const asymmetryAnalysis =
        analysis?.asymmetry_analysis || {};


    const rangeOfMotion =
        biomechanics?.range_of_motion || {};


    const movementSymmetry =
        biomechanics?.movement_symmetry || {};


    const hipStability =
        biomechanics?.hip_stability || {};


    const processedVideo =
        analysis?.processed_video || null;


    /* =====================================================
       VIDEO URL
    ===================================================== */

    const getProcessedVideoUrl = () => {

        if (!processedVideo) {
            return null;
        }


        if (
            processedVideo.startsWith(
                "http://"
            ) ||
            processedVideo.startsWith(
                "https://"
            )
        ) {

            return processedVideo;
        }


        const cleanPath =
            processedVideo
                .replace(/\\/g, "/")
                .replace(/^\/+/, "");


        return `http://127.0.0.1:8000/${cleanPath}`;
    };


    const processedVideoUrl =
        getProcessedVideoUrl();


    /* =====================================================
       VALUES
    ===================================================== */

    const riskScore =
        getNumber(
            risk?.risk_score,
            getNumber(
                video?.risk_score
            )
        );


    const riskLevel =
        risk?.risk_level ||
        video?.risk_level ||
        "Unknown";


    const successRate =
        getNumber(
            analysis?.success_rate
        );


    const movementQuality =
        getNumber(
            biomechanics?.movement_quality
        );


    const balanceScore =
        getNumber(
            biomechanics?.balance_score
        );


    const dataCompleteness =
        getNumber(
            biomechanics?.data_completeness
        );


    const symmetryScore =
        getNumber(
            movementSymmetry?.symmetry_score
        );


    const stabilityScore =
        getNumber(
            hipStability?.stability_score
        );


    const overallAnomalyScore =
        getNumber(
            anomalyDetection?.overall_anomaly_score
        );


    const anomalySeverity =
        anomalyDetection?.severity ||
        "Unknown";


    const riskColor =
        getRiskColor(riskScore);


    const riskColors =
        colorClasses[riskColor];


    /* =====================================================
       JOINT DATA
    ===================================================== */

    const jointData = Object.entries(
        jointAngles
    ).map(
        ([joint, values]) => ({

            joint,

            label:
                joint
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (letter) =>
                        letter.toUpperCase()
                    ),

            average:
                getNumber(
                    values?.average
                ),

            minimum:
                getNumber(
                    values?.minimum
                ),

            maximum:
                getNumber(
                    values?.maximum
                ),

            samples:
                getNumber(
                    values?.samples
                ),

        })
    );


    /* =====================================================
       ANOMALY JOINT DATA
    ===================================================== */

    const anomalyJointData =
        Object.entries(
            anomalyDetection?.joint_analysis ||
            {}
        ).map(
            ([joint, values]) => ({

                joint,

                label:
                    joint
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (letter) =>
                            letter.toUpperCase()
                        ),

                anomaly:
                    values?.anomaly === true,

                anomalyScore:
                    getNumber(
                        values?.anomaly_score
                    ),

                mlScore:
                    getNumber(
                        values?.ml_anomaly_score
                    ),

                meanAngle:
                    getNumber(
                        values?.mean_angle
                    ),

                variation:
                    getNumber(
                        values?.variation
                    ),

                anomalyCount:
                    getNumber(
                        values?.anomaly_count
                    ),

                remarks:
                    Array.isArray(
                        values?.remarks
                    )
                        ? values.remarks
                        : [],

            })
        );


    /* =====================================================
       INJURY DATA
    ===================================================== */

    const injuryData =
        Array.isArray(
            injuryPrediction?.injury_risks
        )
            ? injuryPrediction.injury_risks
            : [];


    /* =====================================================
       REPORT PRINT
    ===================================================== */

    const handlePrintReport = () => {

        window.print();
    };


    /* =====================================================
       SINGLE ANALYSIS PAGE
    ===================================================== */

    return (

        <DashboardLayout title="Analysis">

            <div className="space-y-8 pb-12">


                {/* =================================================
                    TOP BAR
                ================================================= */}

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    <button
                        onClick={() =>
                            navigate("/analysis")
                        }
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition w-fit"
                    >

                        <ArrowLeft size={18} />

                        Back to Analysis

                    </button>


                    <button
                        onClick={handlePrintReport}
                        className="bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition"
                    >

                        <Download size={18} />

                        Print / Save PDF

                    </button>

                </div>


                {/* =================================================
                    HERO
                ================================================= */}

                <section className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-transparent border border-white/10 rounded-3xl p-8">

                    <div className="absolute -right-20 -top-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

                    <div className="relative">

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

                            <div>

                                <div className="flex items-center gap-3 mb-4">

                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">

                                        <Brain
                                            size={30}
                                            className="text-purple-400"
                                        />

                                    </div>


                                    <div>

                                        <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest">
                                            AI Sports Injury Analysis
                                        </p>

                                        <h1 className="text-4xl font-bold text-white mt-1">
                                            {video?.filename ||
                                                "Sports Video"}
                                        </h1>

                                    </div>

                                </div>


                                <p className="text-gray-400 max-w-2xl">

                                    Computer-vision based movement,
                                    biomechanics, anomaly detection
                                    and injury-risk assessment.

                                </p>

                            </div>


                            <div className="flex items-center gap-3">

                                <StatusBadge
                                    label="Analysis completed"
                                    color="green"
                                    icon={
                                        <CheckCircle2
                                            size={16}
                                        />
                                    }
                                />

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    VIDEO INFORMATION
                ================================================= */}

                <Section
                    title="Video Information"
                    icon={
                        <Video
                            size={22}
                            className="text-blue-400"
                        />
                    }
                >

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

                        <StatCard
                            title="Video ID"
                            value={
                                video?.id ?? "--"
                            }
                        />

                        <StatCard
                            title="Athlete ID"
                            value={
                                video?.athlete_id ??
                                "--"
                            }
                        />

                        <StatCard
                            title="Frames"
                            value={
                                analysis?.frames ??
                                "--"
                            }
                        />

                        <StatCard
                            title="Pose Detected"
                            value={
                                analysis?.pose_detected ??
                                "--"
                            }
                        />

                        <StatCard
                            title="FPS"
                            value={
                                analysis?.fps ??
                                "--"
                            }
                        />

                        <StatCard
                            title="Duration"
                            value={
                                analysis?.duration_seconds !==
                                undefined
                                    ? `${formatNumber(
                                        analysis.duration_seconds
                                    )}s`
                                    : "--"
                            }
                        />

                    </div>


                    <div className="mt-5 flex items-center gap-2 text-emerald-400">

                        <CheckCircle2 size={18} />

                        <span className="font-medium">
                            {analysis?.analysis_status ||
                                "Analysis completed."}
                        </span>

                    </div>

                </Section>


                {/* =================================================
                    PROCESSED VIDEO
                ================================================= */}

                {processedVideoUrl && (

                    <Section
                        title="Processed Video"
                        icon={
                            <Play
                                size={22}
                                className="text-purple-400"
                            />
                        }
                    >

                        <div className="bg-black/30 rounded-2xl overflow-hidden border border-white/10">

                            <video
                                controls
                                preload="metadata"
                                className="w-full max-h-[600px] object-contain bg-black"
                                src={processedVideoUrl}
                            />

                        </div>


                        <div className="mt-4 flex flex-col sm:flex-row gap-3">

                            <a
                                href={processedVideoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-semibold transition"
                            >

                                <Play size={18} />

                                Open Processed Video

                            </a>

                        </div>

                    </Section>

                )}


                {/* =================================================
                    RISK OVERVIEW
                ================================================= */}

                <Section
                    title="Risk Analysis"
                    icon={
                        <ShieldAlert
                            size={22}
                            className="text-red-400"
                        />
                    }
                >

                    <div className="grid lg:grid-cols-3 gap-6">

                        {/* RISK GAUGE */}

                        <div className="lg:col-span-1 bg-white/5 rounded-2xl p-7 flex flex-col items-center justify-center">

                            <RiskGauge
                                score={riskScore}
                            />

                            <div className="mt-5 text-center">

                                <p className="text-gray-500 text-sm uppercase tracking-wider">
                                    Risk Level
                                </p>

                                <p
                                    className={`text-2xl font-bold mt-1 ${riskColors.text}`}
                                >
                                    {riskLevel}
                                </p>

                            </div>

                        </div>


                        {/* RISK STATS */}

                        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">

                            <MetricCard
                                title="Risk Score"
                                value={`${formatNumber(
                                    riskScore
                                )}%`}
                                icon={
                                    <Target size={21} />
                                }
                                color={riskColor}
                            />

                            <MetricCard
                                title="Analysis Success"
                                value={`${formatNumber(
                                    successRate
                                )}%`}
                                icon={
                                    <CheckCircle2 size={21} />
                                }
                                color="green"
                            />

                            <MetricCard
                                title="Anomaly Score"
                                value={formatNumber(
                                    overallAnomalyScore
                                )}
                                icon={
                                    <AlertTriangle size={21} />
                                }
                                color={
                                    getRiskColor(
                                        overallAnomalyScore
                                    )
                                }
                            />

                            <MetricCard
                                title="Anomaly Severity"
                                value={
                                    anomalySeverity
                                }
                                icon={
                                    <ShieldAlert size={21} />
                                }
                                color={
                                    getStatusColor(
                                        anomalySeverity
                                    )
                                }
                            />

                        </div>

                    </div>


                    {/* REMARKS */}

                    {Array.isArray(
                        risk?.remarks
                    ) &&
                        risk.remarks.length > 0 && (

                            <div className="mt-7 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">

                                <div className="flex items-center gap-2 mb-4">

                                    <AlertTriangle
                                        size={20}
                                        className="text-yellow-400"
                                    />

                                    <h3 className="font-bold text-lg">
                                        Risk Remarks
                                    </h3>

                                </div>


                                <div className="space-y-3">

                                    {risk.remarks.map(
                                        (remark, index) => (

                                            <div
                                                key={index}
                                                className="flex gap-3 text-gray-300"
                                            >

                                                <span className="text-yellow-400">
                                                    •
                                                </span>

                                                <span>
                                                    {remark}
                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                        )}

                </Section>


                {/* =================================================
                    BIOMECHANICS
                ================================================= */}

                <Section
                    title="Biomechanics Analysis"
                    icon={
                        <Dumbbell
                            size={22}
                            className="text-emerald-400"
                        />
                    }
                >

                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">

                        <ScoreCard
                            title="Movement Quality"
                            value={movementQuality}
                            suffix="%"
                            color="purple"
                        />

                        <ScoreCard
                            title="Balance Score"
                            value={balanceScore}
                            suffix="%"
                            color="blue"
                        />

                        <ScoreCard
                            title="Symmetry Score"
                            value={symmetryScore}
                            suffix="%"
                            color="green"
                        />

                        <ScoreCard
                            title="Data Completeness"
                            value={dataCompleteness}
                            suffix="%"
                            color="blue"
                        />

                    </div>


                    <div className="grid md:grid-cols-2 gap-5 mt-5">

                        <InfoCard
                            title="Joint Alignment"
                            value={
                                biomechanics?.joint_alignment ||
                                "--"
                            }
                            color={
                                getStatusColor(
                                    biomechanics?.joint_alignment
                                )
                            }
                        />


                        <InfoCard
                            title="Movement Quality Status"
                            value={
                                biomechanics?.movement_quality_status ||
                                "--"
                            }
                            color={
                                getStatusColor(
                                    biomechanics?.movement_quality_status
                                )
                            }
                        />

                    </div>

                </Section>


                {/* =================================================
                    ROM
                ================================================= */}

                <Section
                    title="Range of Motion"
                    icon={
                        <TrendingUp
                            size={22}
                            className="text-blue-400"
                        />
                    }
                >

                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">

                        <MetricCard
                            title="Average Knee Angle"
                            value={`${formatNumber(
                                rangeOfMotion?.average_knee_angle
                            )}°`}
                            icon={
                                <Gauge size={20} />
                            }
                            color="blue"
                        />

                        <MetricCard
                            title="Average ROM"
                            value={`${formatNumber(
                                rangeOfMotion?.average_rom
                            )}°`}
                            icon={
                                <BarChart3 size={20} />
                            }
                            color="purple"
                        />

                        <MetricCard
                            title="Left ROM"
                            value={`${formatNumber(
                                rangeOfMotion?.left_rom
                            )}°`}
                            icon={
                                <Activity size={20} />
                            }
                            color="green"
                        />

                        <MetricCard
                            title="Right ROM"
                            value={`${formatNumber(
                                rangeOfMotion?.right_rom
                            )}°`}
                            icon={
                                <Activity size={20} />
                            }
                            color="green"
                        />

                    </div>


                    <div className="mt-6 bg-white/5 rounded-2xl p-6">

                        <div className="flex justify-between items-center mb-5">

                            <h3 className="font-semibold">
                                Left vs Right ROM
                            </h3>

                            <StatusBadge
                                label={
                                    rangeOfMotion?.status ||
                                    "--"
                                }
                                color={
                                    getStatusColor(
                                        rangeOfMotion?.status
                                    )
                                }
                            />

                        </div>


                        <ComparisonBar
                            leftLabel="Left ROM"
                            leftValue={
                                rangeOfMotion?.left_rom
                            }
                            rightLabel="Right ROM"
                            rightValue={
                                rangeOfMotion?.right_rom
                            }
                        />

                    </div>

                </Section>


                {/* =================================================
                    SYMMETRY + HIP STABILITY
                ================================================= */}

                <div className="grid xl:grid-cols-2 gap-8">


                    <Section
                        title="Movement Symmetry"
                        icon={
                            <Activity
                                size={22}
                                className="text-purple-400"
                            />
                        }
                    >

                        <MetricCard
                            title="Symmetry Score"
                            value={`${formatNumber(
                                movementSymmetry?.symmetry_score
                            )}%`}
                            icon={
                                <Target size={20} />
                            }
                            color={
                                getRiskColor(
                                    100 -
                                    getNumber(
                                        movementSymmetry?.symmetry_score
                                    )
                                )
                            }
                        />


                        <div className="mt-5 grid grid-cols-2 gap-4">

                            <MiniStat
                                title="Difference"
                                value={
                                    formatNumber(
                                        movementSymmetry?.difference
                                    )
                                }
                            />

                            <MiniStat
                                title="Status"
                                value={
                                    movementSymmetry?.status ||
                                    "--"
                                }
                            />

                        </div>

                    </Section>


                    <Section
                        title="Hip Stability"
                        icon={
                            <Dumbbell
                                size={22}
                                className="text-yellow-400"
                            />
                        }
                    >

                        <MetricCard
                            title="Stability Score"
                            value={`${formatNumber(
                                hipStability?.stability_score
                            )}%`}
                            icon={
                                <Gauge size={20} />
                            }
                            color={
                                getRiskColor(
                                    100 -
                                    getNumber(
                                        hipStability?.stability_score
                                    )
                                )
                            }
                        />


                        <div className="mt-5 grid grid-cols-2 gap-4">

                            <MiniStat
                                title="Difference"
                                value={
                                    formatNumber(
                                        hipStability?.difference
                                    )
                                }
                            />

                            <MiniStat
                                title="Status"
                                value={
                                    hipStability?.status ||
                                    "--"
                                }
                            />

                        </div>

                    </Section>

                </div>


                {/* =================================================
                    JOINT ANGLES
                ================================================= */}

                {jointData.length > 0 && (

                    <Section
                        title="Joint Angle Analysis"
                        icon={
                            <BarChart3
                                size={22}
                                className="text-blue-400"
                            />
                        }
                    >

                        <div className="space-y-6">

                            {jointData.map(
                                (joint) => {

                                    const average =
                                        Math.min(
                                            180,
                                            Math.max(
                                                0,
                                                joint.average
                                            )
                                        );


                                    return (

                                        <div
                                            key={joint.joint}
                                            className="bg-white/5 rounded-2xl p-5"
                                        >

                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                                <div>

                                                    <h3 className="font-semibold text-lg">
                                                        {joint.label}
                                                    </h3>

                                                    <p className="text-gray-500 text-sm mt-1">
                                                        {joint.samples} samples
                                                    </p>

                                                </div>


                                                <div className="text-right">

                                                    <p className="text-2xl font-bold text-white">
                                                        {formatNumber(
                                                            joint.average
                                                        )}°
                                                    </p>

                                                    <p className="text-gray-500 text-xs">
                                                        Average
                                                    </p>

                                                </div>

                                            </div>


                                            <div className="mt-5">

                                                <div className="h-4 bg-white/10 rounded-full overflow-hidden">

                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                        style={{
                                                            width: `${
                                                                (average /
                                                                    180) *
                                                                100
                                                            }%`,
                                                        }}
                                                    />

                                                </div>


                                                <div className="flex justify-between mt-2 text-xs text-gray-500">

                                                    <span>
                                                        Min{" "}
                                                        {formatNumber(
                                                            joint.minimum
                                                        )}°
                                                    </span>

                                                    <span>
                                                        Max{" "}
                                                        {formatNumber(
                                                            joint.maximum
                                                        )}°
                                                    </span>

                                                </div>

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    </Section>

                )}


                {/* =================================================
                    ANOMALY DETECTION
                ================================================= */}

                <Section
                    title="Movement Anomaly Detection"
                    icon={
                        <Brain
                            size={22}
                            className="text-red-400"
                        />
                    }
                >

                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">

                        <MetricCard
                            title="Overall Anomaly Score"
                            value={formatNumber(
                                overallAnomalyScore
                            )}
                            icon={
                                <AlertTriangle
                                    size={20}
                                />
                            }
                            color={
                                getRiskColor(
                                    overallAnomalyScore
                                )
                            }
                        />

                        <MetricCard
                            title="Severity"
                            value={
                                anomalySeverity
                            }
                            icon={
                                <ShieldAlert
                                    size={20}
                                />
                            }
                            color={
                                getStatusColor(
                                    anomalySeverity
                                )
                            }
                        />

                        <MetricCard
                            title="Anomaly Count"
                            value={
                                anomalyDetection?.anomaly_count ??
                                "--"
                            }
                            icon={
                                <BarChart3
                                    size={20}
                                />
                            }
                            color="yellow"
                        />

                        <MetricCard
                            title="Asymmetry Count"
                            value={
                                anomalyDetection?.asymmetry_count ??
                                "--"
                            }
                            icon={
                                <Activity
                                    size={20}
                                />
                            }
                            color="purple"
                        />

                    </div>


                    {anomalyDetection?.model && (

                        <div className="mt-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-3">

                            <Brain
                                size={20}
                                className="text-blue-400"
                            />

                            <div>

                                <p className="text-gray-400 text-xs uppercase tracking-wider">
                                    Machine Learning Model
                                </p>

                                <p className="font-semibold mt-1">
                                    {anomalyDetection.model}
                                </p>

                            </div>

                        </div>

                    )}


                    {anomalyJointData.length > 0 && (

                        <div className="mt-7 grid lg:grid-cols-2 gap-5">

                            {anomalyJointData.map(
                                (joint) => {

                                    const score =
                                        Math.min(
                                            100,
                                            Math.max(
                                                0,
                                                joint.anomalyScore
                                            )
                                        );


                                    const jointColor =
                                        score >= 35
                                            ? "red"
                                            : score >= 20
                                                ? "yellow"
                                                : "green";


                                    const colors =
                                        colorClasses[
                                            jointColor
                                        ];


                                    return (

                                        <div
                                            key={joint.joint}
                                            className={`rounded-2xl p-6 border ${colors.border} ${colors.bg}`}
                                        >

                                            <div className="flex items-start justify-between gap-4">

                                                <div>

                                                    <h3 className="text-lg font-bold">
                                                        {joint.label}
                                                    </h3>

                                                    <p
                                                        className={`text-sm mt-1 ${colors.text}`}
                                                    >
                                                        {joint.anomaly
                                                            ? "Anomaly detected"
                                                            : "No anomaly detected"}
                                                    </p>

                                                </div>


                                                <div className="text-right">

                                                    <p
                                                        className={`text-2xl font-bold ${colors.text}`}
                                                    >
                                                        {formatNumber(
                                                            joint.anomalyScore
                                                        )}
                                                    </p>

                                                    <p className="text-gray-500 text-xs">
                                                        Anomaly score
                                                    </p>

                                                </div>

                                            </div>


                                            <div className="mt-5 space-y-4">

                                                <ProgressRow
                                                    label="Anomaly Score"
                                                    value={
                                                        joint.anomalyScore
                                                    }
                                                    color={
                                                        jointColor
                                                    }
                                                />

                                                <ProgressRow
                                                    label="ML Score"
                                                    value={
                                                        joint.mlScore
                                                    }
                                                    color="purple"
                                                />

                                            </div>


                                            <div className="grid grid-cols-2 gap-3 mt-5">

                                                <MiniStat
                                                    title="Mean Angle"
                                                    value={`${formatNumber(
                                                        joint.meanAngle
                                                    )}°`}
                                                />

                                                <MiniStat
                                                    title="Variation"
                                                    value={formatNumber(
                                                        joint.variation
                                                    )}
                                                />

                                                <MiniStat
                                                    title="Anomalies"
                                                    value={
                                                        joint.anomalyCount
                                                    }
                                                />

                                                <MiniStat
                                                    title="Status"
                                                    value={
                                                        joint.anomaly
                                                            ? "Detected"
                                                            : "Normal"
                                                    }
                                                />

                                            </div>


                                            {joint.remarks.length >
                                                0 && (

                                                    <div className="mt-5 pt-5 border-t border-white/10 space-y-2">

                                                        {joint.remarks.map(
                                                            (
                                                                remark,
                                                                index
                                                            ) => (

                                                                <p
                                                                    key={
                                                                        index
                                                                    }
                                                                    className="text-sm text-gray-300"
                                                                >
                                                                    •{" "}
                                                                    {remark}
                                                                </p>

                                                            )
                                                        )}

                                                    </div>

                                                )}

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </Section>


                {/* =================================================
                    INJURY PREDICTION
                ================================================= */}

                {injuryData.length > 0 && (

                    <Section
                        title="Injury Prediction"
                        icon={
                            <ShieldAlert
                                size={22}
                                className="text-orange-400"
                            />
                        }
                    >

                        <div className="space-y-5">

                            {injuryData.map(
                                (injury, index) => {

                                    const score =
                                        getNumber(
                                            injury?.risk_score
                                        );


                                    const riskColor =
                                        getRiskColor(
                                            score
                                        );


                                    const colors =
                                        colorClasses[
                                            riskColor
                                        ];


                                    return (

                                        <div
                                            key={index}
                                            className="bg-white/5 rounded-2xl p-5"
                                        >

                                            <div className="flex items-center justify-between gap-4">

                                                <div className="flex items-center gap-3">

                                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">

                                                        <ShieldAlert
                                                            size={19}
                                                            className="text-orange-400"
                                                        />

                                                    </div>


                                                    <div>

                                                        <p className="font-semibold">
                                                            {injury?.injury ||
                                                                "Unknown Injury"}
                                                        </p>

                                                        <p className="text-gray-500 text-xs mt-1">
                                                            Estimated risk
                                                        </p>

                                                    </div>

                                                </div>


                                                <p
                                                    className={`text-xl font-bold ${colors.text}`}
                                                >
                                                    {formatNumber(
                                                        score
                                                    )}%
                                                </p>

                                            </div>


                                            <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">

                                                <div
                                                    className={`h-full ${colors.bar} rounded-full transition-all`}
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            Math.max(
                                                                0,
                                                                score
                                                            )
                                                        )}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    </Section>

                )}


                {/* =================================================
                    FALLBACK INJURY DATA
                ================================================= */}

                {injuryData.length === 0 &&
                    Object.keys(
                        injuryPrediction
                    ).length > 0 && (

                        <Section
                            title="Injury Prediction"
                            icon={
                                <ShieldAlert
                                    size={22}
                                    className="text-orange-400"
                                />
                            }
                        >

                            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">

                                {Object.entries(
                                    injuryPrediction
                                )
                                    .filter(
                                        ([key]) =>
                                            key !==
                                            "injury_risks"
                                    )
                                    .map(
                                        (
                                            [key, value]
                                        ) => {

                                            const score =
                                                getNumber(
                                                    value
                                                );


                                            return (

                                                <MetricCard
                                                    key={key}
                                                    title={key
                                                        .replace(
                                                            /_/g,
                                                            " "
                                                        )
                                                        .replace(
                                                            /\b\w/g,
                                                            (letter) =>
                                                                letter.toUpperCase()
                                                        )}
                                                    value={`${formatNumber(
                                                        score
                                                    )}%`}
                                                    icon={
                                                        <ShieldAlert
                                                            size={20}
                                                        />
                                                    }
                                                    color={getRiskColor(
                                                        score
                                                    )}
                                                />

                                            );
                                        }
                                    )}

                            </div>

                        </Section>

                    )}


                {/* =================================================
                    RECOMMENDATIONS
                ================================================= */}

                {Array.isArray(
                    recommendations?.recommendations
                ) &&
                    recommendations.recommendations.length >
                    0 && (

                        <Section
                            title="Recommendations"
                            icon={
                                <Dumbbell
                                    size={22}
                                    className="text-emerald-400"
                                />
                            }
                        >

                            <div className="grid md:grid-cols-2 gap-4">

                                {recommendations.recommendations.map(
                                    (
                                        item,
                                        index
                                    ) => {

                                        const text =
                                            typeof item ===
                                            "string"
                                                ? item
                                                : item?.recommendation ||
                                                item?.text ||
                                                JSON.stringify(
                                                    item
                                                );


                                        return (

                                            <div
                                                key={index}
                                                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition"
                                            >

                                                <div className="flex gap-4">

                                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">

                                                        {index + 1}

                                                    </div>


                                                    <p className="text-gray-300 leading-relaxed">
                                                        {text}
                                                    </p>

                                                </div>

                                            </div>

                                        );

                                    }
                                )}

                            </div>

                        </Section>

                    )}


                {/* =================================================
                    ANALYSIS SUMMARY
                ================================================= */}

                <section className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-white/10 rounded-3xl p-8">

                    <div className="flex gap-4">

                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">

                            <Info
                                size={23}
                                className="text-blue-400"
                            />

                        </div>


                        <div>

                            <h2 className="text-xl font-bold">
                                Analysis Summary
                            </h2>


                            <p className="text-gray-400 mt-2 leading-relaxed">

                                The movement analysis was completed
                                successfully with{" "}
                                <strong className="text-white">
                                    {formatNumber(
                                        successRate
                                    )}%
                                </strong>{" "}
                                pose-detection success across{" "}
                                <strong className="text-white">
                                    {analysis?.processed_frames ??
                                        analysis?.frames ??
                                        "--"}
                                </strong>{" "}
                                processed frames.

                                The overall estimated injury-risk
                                score is{" "}
                                <strong
                                    className={
                                        riskColors.text
                                    }
                                >
                                    {formatNumber(
                                        riskScore
                                    )}%
                                </strong>{" "}
                                with a{" "}
                                <strong
                                    className={
                                        riskColors.text
                                    }
                                >
                                    {riskLevel}
                                </strong>{" "}
                                classification.

                            </p>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    REPORT
                ================================================= */}

                <section className="bg-white/5 border border-white/10 rounded-3xl p-8">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                        <div>

                            <h2 className="text-2xl font-bold">
                                Report
                            </h2>

                            <p className="text-gray-400 mt-2">
                                Print this analysis and choose
                                "Save as PDF" to create the complete
                                report.
                            </p>

                        </div>


                        <button
                            onClick={handlePrintReport}
                            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition"
                        >

                            <Download size={18} />

                            Download PDF Report

                        </button>

                    </div>

                </section>

            </div>


            {/* =================================================
                PRINT STYLES
            ================================================= */}

            <style>{`

                @media print {

                    body {
                        background: white !important;
                        color: black !important;
                    }

                    nav,
                    aside,
                    button {
                        display: none !important;
                    }

                    * {
                        color: black !important;
                        border-color: #ddd !important;
                    }

                    section,
                    .bg-white\\/5,
                    .bg-white\\/10 {
                        background: white !important;
                    }

                }

            `}</style>

        </DashboardLayout>
    );
}


/* =========================================================
   SECTION
========================================================= */

function Section({
    title,
    icon,
    children,
}) {

    return (

        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">

            <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">

                    {icon}

                </div>


                <h2 className="text-2xl font-bold text-white">
                    {title}
                </h2>

            </div>


            {children}

        </section>
    );
}


/* =========================================================
   LOADING
========================================================= */

function LoadingCard({
    text,
}) {

    return (

        <div className="bg-white/5 border border-white/10 rounded-3xl p-14 text-center">

            <RefreshCw
                size={36}
                className="mx-auto text-purple-400 animate-spin"
            />

            <p className="text-gray-400 mt-5">
                {text}
            </p>

        </div>
    );
}


/* =========================================================
   ERROR
========================================================= */

function ErrorCard({
    error,
    onRetry,
    onBack,
}) {

    return (

        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-7">

            <div className="flex gap-4">

                <AlertTriangle
                    size={25}
                    className="text-red-400 shrink-0"
                />

                <div>

                    <h2 className="font-bold text-lg text-red-300">
                        Unable to load analysis
                    </h2>

                    <p className="text-red-400 mt-2">
                        {error}
                    </p>


                    <div className="flex gap-3 mt-5">

                        {onRetry && (

                            <button
                                onClick={onRetry}
                                className="bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-xl font-semibold"
                            >
                                Retry
                            </button>

                        )}


                        {onBack && (

                            <button
                                onClick={onBack}
                                className="bg-white/10 hover:bg-white/15 px-5 py-2.5 rounded-xl font-semibold"
                            >
                                Back
                            </button>

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
    title,
    value,
}) {

    return (

        <div className="bg-white/5 rounded-2xl p-5">

            <p className="text-gray-500 text-xs uppercase tracking-wider">
                {title}
            </p>

            <p className="text-xl font-bold text-white mt-2">
                {value}
            </p>

        </div>
    );
}


/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
    title,
    value,
    icon,
    color = "blue",
}) {

    const colors =
        colorClasses[color] ||
        colorClasses.blue;


    return (

        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">

            <div className="flex items-center justify-between">

                <p className="text-gray-500 text-sm">
                    {title}
                </p>


                <div
                    className={`w-9 h-9 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}
                >
                    {icon}
                </div>

            </div>


            <p className="text-2xl font-bold text-white mt-4">
                {value}
            </p>

        </div>
    );
}


/* =========================================================
   SCORE CARD
========================================================= */

function ScoreCard({
    title,
    value,
    suffix = "%",
    color = "blue",
}) {

    const colors =
        colorClasses[color] ||
        colorClasses.blue;


    const numericValue =
        Math.min(
            100,
            Math.max(
                0,
                getNumber(value)
            )
        );


    return (

        <div className="bg-white/5 rounded-2xl p-5">

            <div className="flex justify-between items-start">

                <p className="text-gray-500 text-sm">
                    {title}
                </p>


                <span
                    className={`text-lg font-bold ${colors.text}`}
                >
                    {formatNumber(value)}
                    {suffix}
                </span>

            </div>


            <div className="h-3 bg-white/10 rounded-full mt-5 overflow-hidden">

                <div
                    className={`h-full ${colors.bar} rounded-full`}
                    style={{
                        width: `${numericValue}%`,
                    }}
                />

            </div>

        </div>
    );
}


/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
    title,
    value,
    color = "blue",
}) {

    const colors =
        colorClasses[color] ||
        colorClasses.blue;


    return (

        <div
            className={`rounded-2xl p-5 ${colors.bg} border ${colors.border}`}
        >

            <p className="text-gray-500 text-sm">
                {title}
            </p>

            <p
                className={`text-xl font-bold mt-2 ${colors.text}`}
            >
                {value}
            </p>

        </div>
    );
}


/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
    title,
    value,
}) {

    return (

        <div className="bg-white/5 rounded-xl p-4">

            <p className="text-gray-500 text-xs">
                {title}
            </p>

            <p className="text-white font-semibold mt-1">
                {value}
            </p>

        </div>
    );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
    label,
    color = "blue",
    icon,
}) {

    const colors =
        colorClasses[color] ||
        colorClasses.blue;


    return (

        <span
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${colors.bg} ${colors.text} border ${colors.border} text-sm font-semibold`}
        >

            {icon}

            {label}

        </span>
    );
}


/* =========================================================
   RISK GAUGE
========================================================= */

function RiskGauge({
    score,
}) {

    const value =
        Math.min(
            100,
            Math.max(
                0,
                getNumber(score)
            )
        );


    const color =
        getRiskColor(value);


    const colors =
        colorClasses[color];


    const radius = 72;

    const circumference =
        2 *
        Math.PI *
        radius;


    const dashOffset =
        circumference -
        (value / 100) *
        circumference;


    return (

        <div className="relative w-48 h-48">

            <svg
                width="192"
                height="192"
                viewBox="0 0 192 192"
                className="-rotate-90"
            >

                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="none"
                    className="text-white/10"
                />


                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                    className={colors.text}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                />

            </svg>


            <div className="absolute inset-0 flex flex-col items-center justify-center">

                <p
                    className={`text-4xl font-bold ${colors.text}`}
                >
                    {formatNumber(value)}%
                </p>

                <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">
                    Risk
                </p>

            </div>

        </div>
    );
}


/* =========================================================
   COMPARISON BAR
========================================================= */

function ComparisonBar({
    leftLabel,
    leftValue,
    rightLabel,
    rightValue,
}) {

    const left =
        getNumber(leftValue);


    const right =
        getNumber(rightValue);


    const max =
        Math.max(
            left,
            right,
            1
        );


    return (

        <div className="space-y-5">

            <ProgressRow
                label={leftLabel}
                value={(left / max) * 100}
                displayValue={`${formatNumber(
                    left
                )}°`}
                color="purple"
            />


            <ProgressRow
                label={rightLabel}
                value={(right / max) * 100}
                displayValue={`${formatNumber(
                    right
                )}°`}
                color="blue"
            />

        </div>
    );
}


/* =========================================================
   PROGRESS ROW
========================================================= */

function ProgressRow({
    label,
    value,
    displayValue,
    color = "blue",
}) {

    const colors =
        colorClasses[color] ||
        colorClasses.blue;


    const width =
        Math.min(
            100,
            Math.max(
                0,
                getNumber(value)
            )
        );


    return (

        <div>

            <div className="flex justify-between mb-2">

                <span className="text-sm text-gray-400">
                    {label}
                </span>


                <span className="text-sm font-semibold text-white">
                    {displayValue ??
                        `${formatNumber(value)}%`}
                </span>

            </div>


            <div className="h-3 bg-white/10 rounded-full overflow-hidden">

                <div
                    className={`h-full ${colors.bar} rounded-full transition-all`}
                    style={{
                        width: `${width}%`,
                    }}
                />

            </div>

        </div>
    );
}
