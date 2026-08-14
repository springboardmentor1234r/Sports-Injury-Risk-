import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function UploadVideo() {
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [athlete, setAthlete] = useState("");
    const [sport, setSport] = useState("");
    const [athletes, setAthletes] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState("");
    const [savedName, setSavedName] = useState("");

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Fetch profile first to get the role
                const profileRes = await API.get("/auth/profile");
                const role = profileRes.data.user.role;
                setUserRole(role);

                // Fetch roster
                const athletesRes = await API.get("/athletes");
                const list = athletesRes.data.athletes || [];
                setAthletes(list);

                // Auto-select athlete's own ID behind the scenes
                if (list.length >= 1) {
                    setAthlete(list[0]._id);
                }
            } catch (requestError) {
                setError(requestError.response?.data?.message || "Could not load roster information");
            }
        };
        loadInitialData();
    }, []);

    const handleUpload = async () => {
        if (!video || !athlete || !sport) {
            setError("Please name this session and select a video clip first.");
            return;
        }
        try {
            setError("");
            setAnalysis(null);
            setUploading(true);
            const formData = new FormData();
            formData.append("video", video);
            formData.append("athlete", athlete);
            formData.append("sport", sport); // session name
            const response = await API.post("/videos/upload", formData, {
                timeout: 120000
            });
            setAnalysis(response.data.analysis);
            setSavedName(sport);
            setVideo(null);
            setSport("");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Upload and analysis failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Analysis / New session</p>
                    <h1>Upload a movement video</h1>
                    <p>Give the model a clear view of the movement you want to understand.</p>
                </div>
                <Link className="btn btn-secondary" to="/reports">View analyses</Link>
            </div>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <div className="split-layout">
                <section className="card card-pad">
                    <div className="card-title">
                        <div>
                            <h2>Video file</h2>
                            <p>MP4, MOV, or AVI up to 250 MB.</p>
                        </div>
                    </div>
                    <div className="upload-zone">
                        <strong>{video ? video.name : "Drop your video here"}</strong>
                        <p>{video ? "Ready to upload when the details are complete." : "Or choose a file from your device."}</p>
                        <input type="file" accept="video/*" onChange={(event) => setVideo(event.target.files[0])} />
                    </div>
                </section>
                <section className="card card-pad">
                    <div className="card-title">
                        <div>
                            <h2>Session details</h2>
                            <p>Give a relevant name to your uploaded movement.</p>
                        </div>
                    </div>
                    <div className="form-field" style={{marginBottom: 20}}>
                        <label htmlFor="sport">Name</label>
                        <input 
                            className="field-input" 
                            id="sport" 
                            value={sport} 
                            onChange={(event) => setSport(event.target.value)} 
                            placeholder="e.g. Morning Sprint, Knee extension drill" 
                        />
                    </div>
                    <button 
                        className="btn btn-primary" 
                        style={{width: "100%", marginTop: 22}} 
                        onClick={handleUpload} 
                        disabled={uploading}
                    >
                        {uploading ? "Analyzing video..." : "Start analysis"}
                    </button>
                </section>
            </div>
            {analysis && (
                <section className="card card-pad" style={{marginTop: 20}}>
                    <div className="card-title">
                        <div>
                            <h2>Analysis complete: {savedName}</h2>
                            <p>This session has been successfully saved to your Analysis Reports.</p>
                        </div>
                        <span className="badge badge-low">Completed</span>
                    </div>

                    <div className="form-grid" style={{marginTop: 20}}>
                        <div className="card card-pad" style={{border: '1px solid var(--line)', background: '#fcfdfe'}}>
                            <h3 style={{marginTop: 0, marginBottom: 16, fontSize: 16, borderBottom: '1px solid var(--line)', paddingBottom: 8}}>Injury Risk Prediction</h3>
                            <div style={{display: 'grid', gap: 12}}>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span style={{color: 'var(--muted)', fontSize: 13}}>Injury Risk Score:</span>
                                    <strong style={{color: analysis.riskScore >= 70 ? 'var(--danger)' : analysis.riskScore >= 40 ? 'var(--warning)' : 'var(--success)'}}>{analysis.riskScore}%</strong>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span style={{color: 'var(--muted)', fontSize: 13}}>Movement Score:</span>
                                    <strong>{analysis.movementScore} / 100</strong>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span style={{color: 'var(--muted)', fontSize: 13}}>Prediction Category:</span>
                                    <strong>{analysis.mlPrediction}</strong>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span style={{color: 'var(--muted)', fontSize: 13}}>Knee Symmetry:</span>
                                    <strong>{analysis.symmetry?.knee || "Symmetric"}</strong>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span style={{color: 'var(--muted)', fontSize: 13}}>Elbow Symmetry:</span>
                                    <strong>{analysis.symmetry?.elbow || "Symmetric"}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="card card-pad" style={{border: '1px solid var(--line)', background: '#fcfdfe'}}>
                            <h3 style={{marginTop: 0, marginBottom: 16, fontSize: 16, borderBottom: '1px solid var(--line)', paddingBottom: 8}}>Corrective Exercise Recommendations</h3>
                            <div style={{display: 'grid', gap: 12}}>
                                <div>
                                    {analysis.recommendations && analysis.recommendations.length > 0 ? (
                                        <ul style={{margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--ink)', lineHeight: '1.6'}}>
                                            {analysis.recommendations.map((rec, i) => (
                                                <li key={i} style={{marginBottom: 8}}>{rec}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{margin: 0, fontSize: 13, color: 'var(--muted)'}}>No specific corrective exercises recommended.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{marginTop: 24, textAlign: 'right'}}>
                        <button className="btn btn-primary" onClick={() => navigate("/reports")}>
                            Save & view reports
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}

export default UploadVideo;
