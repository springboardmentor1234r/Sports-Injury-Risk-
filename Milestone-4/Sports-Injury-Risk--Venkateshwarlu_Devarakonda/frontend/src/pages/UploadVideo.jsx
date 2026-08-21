import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    Upload,
    CheckCircle,
    Video,
    FileText,
    BarChart3,
    ShieldAlert,
} from "lucide-react";

import api from "../services/api";

import DashboardLayout
    from "../components/DashboardLayout";

import {
    useAuth,
    VIDEO_UPLOAD_ROLES,
    normalizeRole,
} from "../context/AuthContext";

const BACKEND_URL =
    "http://127.0.0.1:8000";

export default function UploadVideo() {
    const navigate = useNavigate();

    const {
        role,
        loading: authLoading,
    } = useAuth();

    const currentRole = normalizeRole(role);

    const canUpload =
        VIDEO_UPLOAD_ROLES.includes(
            currentRole
        );

    const [file, setFile] =
        useState(null);

    const [videoURL, setVideoURL] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [result, setResult] =
        useState(null);

    useEffect(() => {
        return () => {
            if (videoURL) {
                URL.revokeObjectURL(
                    videoURL
                );
            }
        };
    }, [videoURL]);

    useEffect(() => {
        if (
            !authLoading &&
            !canUpload
        ) {
            navigate(
                "/dashboard",
                {
                    replace: true,
                }
            );
        }
    }, [
        authLoading,
        canUpload,
        navigate,
    ]);

    const handleFileChange = (event) => {
        const selected =
            event.target.files?.[0];

        if (!selected) {
            return;
        }

        if (
            !selected.type.startsWith(
                "video/"
            )
        ) {
            alert(
                "Please select a valid video file."
            );

            event.target.value = "";
            return;
        }

        if (videoURL) {
            URL.revokeObjectURL(
                videoURL
            );
        }

        const previewURL =
            URL.createObjectURL(
                selected
            );

        setFile(selected);
        setVideoURL(previewURL);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!canUpload) {
            alert(
                "Your account is not authorized to upload videos."
            );
            return;
        }

        if (!file) {
            alert(
                "Please select a video."
            );
            return;
        }

        const token =
            localStorage.getItem(
                "token"
            );

        if (!token) {
            navigate(
                "/login",
                {
                    replace: true,
                }
            );
            return;
        }

        try {
            setLoading(true);

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            const response =
                await api.post(
                    "/video/upload",
                    formData,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "multipart/form-data",
                        },
                    }
                );

            setResult(
                response.data
            );

            alert(
                "Video uploaded and analyzed successfully."
            );
        } catch (error) {
            console.error(
                "UPLOAD ERROR:",
                error
            );

            const status =
                error?.response?.status;

            if (status === 401) {
                localStorage.removeItem(
                    "token"
                );

                navigate(
                    "/login",
                    {
                        replace: true,
                    }
                );

                return;
            }

            if (status === 403) {
                alert(
                    "Your account is not authorized to upload videos."
                );

                navigate(
                    "/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            alert(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Unable to upload the video. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async (
        videoId
    ) => {
        const token =
            localStorage.getItem(
                "token"
            );

        if (!token) {
            navigate(
                "/login",
                {
                    replace: true,
                }
            );
            return;
        }

        try {
            const response =
                await api.get(
                    `/video/report/${videoId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                        responseType:
                            "blob",
                    }
                );

            const contentType =
                response.headers[
                    "content-type"
                ] || "";

            if (
                !contentType.includes(
                    "application/pdf"
                )
            ) {
                const text =
                    await response.data.text();

                let message =
                    "Failed to generate PDF.";

                try {
                    const json =
                        JSON.parse(text);

                    message =
                        json.detail ||
                        json.message ||
                        message;
                } catch {
                    if (text) {
                        message = text;
                    }
                }

                throw new Error(
                    message
                );
            }

            const blob =
                new Blob(
                    [response.data],
                    {
                        type:
                            "application/pdf",
                    }
                );

            const url =
                window.URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href = url;

            link.download =
                `Sports_Injury_Report_${videoId}.pdf`;

            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );

            window.URL.revokeObjectURL(
                url
            );
        } catch (error) {
            console.error(
                "PDF DOWNLOAD ERROR:",
                error
            );

            alert(
                error.message ||
                "Unable to download PDF report."
            );
        }
    };

    if (authLoading) {
        return (
            <DashboardLayout
                title="Upload Video"
            >
                <div className="sp-loading">
                    <div className="sp-loading-spinner" />
                    <p>
                        Checking account permissions...
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    if (!canUpload) {
        return (
            <DashboardLayout
                title="Upload Video"
            >
                <div className="sp-loading">
                    <ShieldAlert
                        size={42}
                    />

                    <p>
                        Your account is not
                        authorized to upload videos.
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Upload Video"
        >
            <div className="flex justify-center">
                <div className="w-full max-w-5xl bg-white/5 border border-white/10 rounded-3xl p-10">
                    <h1 className="text-4xl font-bold text-white">
                        Upload Sports Video
                    </h1>

                    <p className="text-gray-400 mt-3">
                        Upload a sports video for AI pose estimation and injury risk analysis.
                    </p>

                    <label
                        htmlFor="video-upload"
                        className="mt-8 border-2 border-dashed border-blue-500 rounded-2xl p-12 flex flex-col justify-center items-center cursor-pointer hover:border-blue-300 transition"
                    >
                        <Upload
                            size={70}
                            className="text-blue-400"
                        />

                        <h2 className="text-white text-xl font-semibold mt-5">
                            Click anywhere to upload video
                        </h2>

                        <p className="text-gray-400 mt-2">
                            MP4 / AVI / MOV / MKV / WEBM
                        </p>

                        {file && (
                            <div className="mt-6 bg-blue-500/10 px-5 py-3 rounded-xl">
                                <p className="text-blue-300 font-semibold">
                                    {file.name}
                                </p>
                            </div>
                        )}

                        <input
                            id="video-upload"
                            type="file"
                            accept="video/*"
                            onChange={
                                handleFileChange
                            }
                            className="hidden"
                        />
                    </label>

                    {videoURL && (
                        <div className="mt-10">
                            <h2 className="text-white text-2xl font-bold mb-4">
                                Original Video
                            </h2>

                            <video
                                controls
                                className="rounded-2xl border border-gray-700 w-full"
                            >
                                <source
                                    src={videoURL}
                                    type={
                                        file?.type ||
                                        "video/mp4"
                                    }
                                />
                            </video>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={
                            handleUpload
                        }
                        disabled={loading}
                        className="w-full mt-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-xl py-4 text-white font-bold text-lg transition"
                    >
                        {loading
                            ? "Uploading & Running Pose Estimation..."
                            : "Upload Video"}
                    </button>

                    {result && (
                        <div className="mt-12">
                            <div className="flex items-center gap-3 mb-6">
                                <CheckCircle
                                    className="text-green-400"
                                    size={30}
                                />

                                <h2 className="text-green-400 text-2xl font-bold">
                                    Analysis Completed
                                </h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-5">
                                <InfoCard
                                    title="Filename"
                                    value={
                                        result.filename
                                    }
                                />

                                <InfoCard
                                    title="Video ID"
                                    value={
                                        result.id
                                    }
                                />

                                <InfoCard
                                    title="Athlete ID"
                                    value={
                                        result.athlete_id
                                    }
                                />

                                <InfoCard
                                    title="Uploaded"
                                    value={
                                        result.uploaded_at
                                            ? new Date(
                                                result.uploaded_at
                                            ).toLocaleString()
                                            : "--"
                                    }
                                />
                            </div>

                            <div className="mt-10 flex flex-wrap gap-5 justify-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/analysis/${result.id}`
                                        )
                                    }
                                    className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl flex items-center gap-3 text-white font-bold"
                                >
                                    <BarChart3
                                        size={22}
                                    />

                                    View Full Analysis
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        downloadReport(
                                            result.id
                                        )
                                    }
                                    className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl flex items-center gap-3 text-white font-bold"
                                >
                                    <FileText
                                        size={22}
                                    />

                                    Download PDF Report
                                </button>

                                {result.analysis
                                    ?.processed_video && (
                                    <a
                                        href={
                                            result
                                                .analysis
                                                .processed_video
                                                .startsWith(
                                                    "http"
                                                )
                                                ? result
                                                    .analysis
                                                    .processed_video
                                                : `${BACKEND_URL}/${String(
                                                    result
                                                        .analysis
                                                        .processed_video
                                                ).replace(
                                                    /^\/+/,
                                                    ""
                                                )}`
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl flex items-center gap-3 text-white font-bold"
                                    >
                                        <Video
                                            size={22}
                                        />

                                        View Processed Video
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function InfoCard({
    title,
    value,
}) {
    return (
        <div className="bg-white/5 rounded-xl p-5">
            <h3 className="text-gray-400">
                {title}
            </h3>

            <p className="text-white font-bold mt-2">
                {value ?? "--"}
            </p>
        </div>
    );
}