import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileText,
    Eye,
    Download,
    RefreshCw,
} from "lucide-react";

import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

const BACKEND_URL = "http://127.0.0.1:8000";

export default function Reports() {

    const navigate = useNavigate();

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);
    const [error, setError] = useState("");


    /* ================= LOAD REPORTS ================= */

    const loadReports = async () => {

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

            let data = [];

            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response.data?.videos)) {
                data = response.data.videos;
            } else if (Array.isArray(response.data?.history)) {
                data = response.data.history;
            }

            /*
             * Only videos which have analysis
             * are shown as reports.
             */

            const reports = data.filter(
                (video) =>
                    video.has_analysis === true ||
                    video.hasAnalysis === true ||
                    video.risk_level !== null ||
                    video.risk_score !== null
            );

            setVideos(reports);

        } catch (err) {

            console.error(
                "Failed to load reports:",
                err
            );

            if (err?.response?.status === 401) {

                localStorage.clear();

                navigate("/login");

                return;
            }

            setError(
                err?.response?.data?.detail ||
                "Unable to load reports."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {
        loadReports();
    }, []);


    /* ================= DOWNLOAD PDF ================= */

    const downloadReport = async (videoId, filename) => {

        if (!videoId) {
            alert("Video ID is missing.");
            return;
        }

        try {

            setDownloading(videoId);

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await api.get(
                `/video/report/${videoId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: "blob",
                }
            );

            /*
             * If backend returns an error with responseType=blob,
             * Axios also gives us a Blob.
             *
             * Therefore check the content type before downloading.
             */

            const contentType =
                response.headers["content-type"] || "";

            if (
                !contentType.includes("application/pdf")
            ) {

                const text = await response.data.text();

                let message = "Failed to generate PDF.";

                try {

                    const json = JSON.parse(text);

                    message =
                        json.detail ||
                        message;

                } catch {
                    if (text) {
                        message = text;
                    }
                }

                throw new Error(message);
            }


            /* ================= CREATE DOWNLOAD ================= */

            const blob = new Blob(
                [response.data],
                {
                    type: "application/pdf",
                }
            );

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            const safeName =
                filename
                    ? filename
                        .replace(/\.[^/.]+$/, "")
                        .replace(/[^a-zA-Z0-9_-]/g, "_")
                    : `video_${videoId}`;

            link.download =
                `Sports_Injury_Report_${safeName}.pdf`;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);

        } catch (err) {

            console.error(
                "PDF download failed:",
                err
            );

            alert(
                err?.message ||
                err?.response?.data?.detail ||
                "Unable to download PDF report."
            );

        } finally {

            setDownloading(null);

        }

    };


    /* ================= PAGE ================= */

    return (

        <DashboardLayout title="Reports">

            <div className="min-h-[70vh]">

                {/* ================= HEADER ================= */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

                    <div>

                        <div className="flex items-center gap-3">

                            <FileText
                                size={34}
                                className="text-blue-400"
                            />

                            <h1 className="text-4xl font-bold text-white">
                                Reports
                            </h1>

                        </div>

                        <p className="text-gray-400 mt-2">
                            View and download injury risk assessment reports.
                        </p>

                    </div>


                    <button
                        onClick={loadReports}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
                    >

                        <RefreshCw size={18} />

                        Refresh

                    </button>

                </div>


                {/* ================= LOADING ================= */}

                {loading && (

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">

                        <p className="text-gray-400 text-lg">
                            Loading reports...
                        </p>

                    </div>

                )}


                {/* ================= ERROR ================= */}

                {!loading && error && (

                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">

                        <p className="text-red-400">
                            {error}
                        </p>

                        <button
                            onClick={loadReports}
                            className="mt-5 bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg font-semibold"
                        >
                            Try Again
                        </button>

                    </div>

                )}


                {/* ================= EMPTY ================= */}

                {!loading &&
                    !error &&
                    videos.length === 0 && (

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">

                            <FileText
                                size={60}
                                className="mx-auto text-gray-500"
                            />

                            <h2 className="text-2xl font-semibold text-white mt-5">
                                No Reports Available
                            </h2>

                            <p className="text-gray-400 mt-3">
                                Upload and analyze a sports video to generate a report.
                            </p>

                            <button
                                onClick={() => navigate("/upload")}
                                className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
                            >
                                Upload Video
                            </button>

                        </div>

                    )}


                {/* ================= REPORT CARDS ================= */}

                {!loading &&
                    !error &&
                    videos.length > 0 && (

                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

                            {videos.map((video) => {

                                const videoId =
                                    video.id ??
                                    video.video_id ??
                                    video.videoId;

                                const filename =
                                    video.filename ??
                                    video.file_name ??
                                    "Unknown Video";

                                const uploadedAt =
                                    video.uploaded_at ??
                                    video.created_at;

                                const riskLevel =
                                    video.risk_level ??
                                    video.riskLevel ??
                                    "Unknown";

                                const riskScore =
                                    video.risk_score ??
                                    video.riskScore;


                                return (

                                    <div
                                        key={videoId}
                                        className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition"
                                    >

                                        {/* Icon */}

                                        <div className="flex items-center justify-between">

                                            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">

                                                <FileText
                                                    size={25}
                                                    className="text-blue-400"
                                                />

                                            </div>

                                            <span className="text-xs text-gray-500">
                                                Report #{videoId}
                                            </span>

                                        </div>


                                        {/* Filename */}

                                        <h2 className="text-xl font-bold text-white mt-5 break-words">
                                            {filename}
                                        </h2>


                                        {/* Date */}

                                        <p className="text-gray-400 text-sm mt-2">

                                            {uploadedAt
                                                ? new Date(
                                                    uploadedAt
                                                ).toLocaleString()
                                                : "--"}

                                        </p>


                                        {/* Risk */}

                                        <div className="mt-6 grid grid-cols-2 gap-4">

                                            <div className="bg-white/5 rounded-xl p-4">

                                                <p className="text-gray-400 text-sm">
                                                    Risk Level
                                                </p>

                                                <p className="text-white font-bold mt-1">
                                                    {riskLevel}
                                                </p>

                                            </div>


                                            <div className="bg-white/5 rounded-xl p-4">

                                                <p className="text-gray-400 text-sm">
                                                    Risk Score
                                                </p>

                                                <p className="text-white font-bold mt-1">
                                                    {riskScore !== null &&
                                                    riskScore !== undefined
                                                        ? `${riskScore}%`
                                                        : "--"}
                                                </p>

                                            </div>

                                        </div>


                                        {/* Buttons */}

                                        <div className="mt-6 space-y-3">

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/analysis/${videoId}`
                                                    )
                                                }
                                                className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition"
                                            >

                                                <Eye size={18} />

                                                View Analysis

                                            </button>


                                            <button
                                                onClick={() =>
                                                    downloadReport(
                                                        videoId,
                                                        filename
                                                    )
                                                }
                                                disabled={
                                                    downloading === videoId
                                                }
                                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition"
                                            >

                                                <Download size={18} />

                                                {downloading === videoId
                                                    ? "Generating PDF..."
                                                    : "Download PDF"}

                                            </button>

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    )}

            </div>

        </DashboardLayout>

    );

}