import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function History() {
    const navigate = useNavigate();

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
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

            /*
             * Backend may return:
             *
             * [
             *   {...},
             *   {...}
             * ]
             *
             * OR:
             *
             * {
             *   videos: [...]
             * }
             *
             * OR:
             *
             * {
             *   history: [...]
             * }
             */

            let historyData = [];

            if (Array.isArray(response.data)) {
                historyData = response.data;
            } else if (
                Array.isArray(response.data?.videos)
            ) {
                historyData = response.data.videos;
            } else if (
                Array.isArray(response.data?.history)
            ) {
                historyData = response.data.history;
            }

            setVideos(historyData);

        } catch (err) {
            console.error(
                "Failed to load history:",
                err
            );

            if (err?.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("username");
                localStorage.removeItem("role");

                navigate("/login");
                return;
            }

            setError(
                err?.response?.data?.detail ||
                "Unable to load upload history."
            );

        } finally {
            setLoading(false);
        }
    };

    /*
     * IMPORTANT:
     *
     * App.jsx has:
     *
     * /analysis/:videoId
     *
     * Therefore we MUST navigate using:
     *
     * /analysis/123
     *
     * NOT:
     *
     * /analysis
     */

    const openAnalysis = (videoId) => {
        if (!videoId) {
            alert("Video ID is missing.");
            return;
        }

        navigate(`/analysis/${videoId}`);
    };

    const getVideoURL = (filepath) => {
        if (!filepath) {
            return "";
        }

        if (
            typeof filepath === "string" &&
            filepath.startsWith("http")
        ) {
            return filepath;
        }

        const cleanPath = String(filepath)
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

        return `${BACKEND_URL}/${cleanPath}`;
    };

    const getRiskColor = (riskLevel) => {
        const level = String(riskLevel || "")
            .trim()
            .toLowerCase();

        if (
            level === "high" ||
            level === "critical"
        ) {
            return "text-red-400";
        }

        if (
            level === "medium" ||
            level === "moderate"
        ) {
            return "text-yellow-400";
        }

        if (level === "low") {
            return "text-green-400";
        }

        return "text-gray-400";
    };

    return (
        <DashboardLayout title="Upload History">

            <div className="min-h-[70vh]">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

                    <div>
                        <h1 className="text-4xl font-bold text-white">
                            Upload History
                        </h1>

                        <p className="text-gray-400 mt-2">
                            View your uploaded videos and analysis results.
                        </p>
                    </div>

                    <button
                        onClick={loadHistory}
                        className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-white font-semibold transition"
                    >
                        Refresh
                    </button>

                </div>

                {/* Loading */}
                {loading && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">

                        <p className="text-gray-400 text-lg">
                            Loading upload history...
                        </p>

                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">

                        <p className="text-red-400">
                            {error}
                        </p>

                        <button
                            onClick={loadHistory}
                            className="mt-5 bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-white font-semibold"
                        >
                            Try Again
                        </button>

                    </div>
                )}

                {/* Empty History */}
                {!loading &&
                    !error &&
                    videos.length === 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">

                            <h2 className="text-2xl font-semibold text-white">
                                No Uploads Found
                            </h2>

                            <p className="text-gray-400 mt-3">
                                You have not uploaded any videos yet.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/upload")
                                }
                                className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-white font-semibold"
                            >
                                Upload Video
                            </button>

                        </div>
                    )}

                {/* History Table */}
                {!loading &&
                    !error &&
                    videos.length > 0 && (

                        <div className="overflow-x-auto rounded-2xl border border-white/10">

                            <table className="w-full text-white">

                                <thead className="bg-blue-700">

                                    <tr>

                                        <th className="p-4 text-left">
                                            ID
                                        </th>

                                        <th className="p-4 text-left">
                                            Filename
                                        </th>

                                        <th className="p-4 text-left">
                                            Upload Time
                                        </th>

                                        <th className="p-4 text-left">
                                            Risk Level
                                        </th>

                                        <th className="p-4 text-left">
                                            Risk Score
                                        </th>

                                        <th className="p-4 text-left">
                                            Video
                                        </th>

                                        <th className="p-4 text-left">
                                            Analysis
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {videos.map((video) => {

                                        const videoId =
                                            video.id ??
                                            video.video_id ??
                                            video.videoId;

                                        const filename =
                                            video.filename ??
                                            video.file_name ??
                                            video.original_filename ??
                                            "Unknown";

                                        const uploadedAt =
                                            video.uploaded_at ??
                                            video.created_at ??
                                            video.upload_time;

                                        const riskLevel =
                                            video.risk_level ??
                                            video.riskLevel ??
                                            null;

                                        const riskScore =
                                            video.risk_score ??
                                            video.riskScore ??
                                            null;

                                        const filepath =
                                            video.filepath ??
                                            video.file_path ??
                                            video.video_path ??
                                            null;

                                        const hasAnalysis =
                                            video.has_analysis === true ||
                                            video.hasAnalysis === true ||
                                            riskLevel !== null ||
                                            riskScore !== null;

                                        return (
                                            <tr
                                                key={videoId}
                                                className="border-b border-gray-700 hover:bg-white/5 transition"
                                            >

                                                {/* ID */}
                                                <td className="p-4">
                                                    {videoId ?? "--"}
                                                </td>

                                                {/* Filename */}
                                                <td className="p-4">
                                                    {filename}
                                                </td>

                                                {/* Upload Time */}
                                                <td className="p-4">

                                                    {uploadedAt ? (
                                                        new Date(
                                                            uploadedAt
                                                        ).toLocaleString()
                                                    ) : (
                                                        "--"
                                                    )}

                                                </td>

                                                {/* Risk Level */}
                                                <td className="p-4">

                                                    {riskLevel ? (

                                                        <span
                                                            className={`font-bold ${getRiskColor(
                                                                riskLevel
                                                            )}`}
                                                        >
                                                            {riskLevel}
                                                        </span>

                                                    ) : (

                                                        <span className="text-gray-400">
                                                            Pending
                                                        </span>

                                                    )}

                                                </td>

                                                {/* Risk Score */}
                                                <td className="p-4">

                                                    {riskScore !== null &&
                                                    riskScore !== undefined ? (

                                                        <span className="font-bold">
                                                            {riskScore}%
                                                        </span>

                                                    ) : (

                                                        <span className="text-gray-400">
                                                            --
                                                        </span>

                                                    )}

                                                </td>

                                                {/* Video */}
                                                <td className="p-4">

                                                    {filepath ? (

                                                        <a
                                                            href={getVideoURL(
                                                                filepath
                                                            )}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-block bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition"
                                                        >
                                                            Open
                                                        </a>

                                                    ) : (

                                                        <span className="text-gray-400">
                                                            --
                                                        </span>

                                                    )}

                                                </td>

                                                {/* Analysis */}
                                                <td className="p-4">

                                                    {hasAnalysis &&
                                                    videoId ? (

                                                        <button
                                                            onClick={() =>
                                                                openAnalysis(
                                                                    videoId
                                                                )
                                                            }
                                                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition"
                                                        >
                                                            View Analysis
                                                        </button>

                                                    ) : (

                                                        <span className="text-gray-400">
                                                            Pending
                                                        </span>

                                                    )}

                                                </td>

                                            </tr>
                                        );
                                    })}

                                </tbody>

                            </table>

                        </div>

                    )}

            </div>

        </DashboardLayout>
    );
}