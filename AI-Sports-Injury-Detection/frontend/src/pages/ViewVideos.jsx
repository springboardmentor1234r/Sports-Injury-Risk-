import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function ViewVideos() {
    const [videos, setVideos] = useState([]); const [loading, setLoading] = useState(true);
    useEffect(() => { const fetchVideos = async () => { try { const response = await API.get("/videos"); setVideos(response.data.videos || []); } catch (error) { alert(error.response?.data?.message || "Failed to fetch videos"); } finally { setLoading(false); } }; fetchVideos(); }, []);
    return <div><div className="page-heading"><div><p className="eyebrow">Analysis / History</p><h1>Analysis results</h1><p>Review every submitted session and its current processing state.</p></div><Link className="btn btn-accent" to="/upload-video">+ New analysis</Link></div><section className="card card-pad"><div className="card-title"><div><h2>Recent sessions</h2><p>{videos.length ? `${videos.length} sessions in your workspace` : "Your completed and pending sessions will appear here."}</p></div></div>{loading ? <div className="empty-state">Loading analysis history...</div> : videos.length === 0 ? <div className="empty-state">No videos uploaded yet. Start with a movement recording.</div> : videos.map((video) => <div className="video-item" key={video._id}><div><h3>{video.athlete?.name || "Unassigned athlete"}</h3><p>{video.sport || "Movement session"} · Uploaded by {video.uploadedBy?.name || "you"}</p></div><div style={{display: "flex", alignItems: "center", gap: 12}}><span className="badge badge-low">{video.status || "Queued"}</span><a className="btn btn-secondary" href={video.videoUrl} target="_blank" rel="noreferrer">View video</a></div></div>)}</section></div>;
}
export default ViewVideos;
