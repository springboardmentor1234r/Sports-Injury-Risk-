import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function Prediction() {
    const [file, setFile] = useState(null);
    const [athlete, setAthlete] = useState("");
    const [sport, setSport] = useState("Injury Risk Screening");
    const [athletes, setAthletes] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState("");

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

                // If user is an athlete and list has 1 item, auto-select it
                if (role === "athlete" && list.length === 1) {
                    setAthlete(list[0]._id);
                }
            } catch (requestError) {
                setError(requestError.response?.data?.message || "Could not load roster information");
            }
        };
        loadInitialData();
    }, []);

    const handleRunPrediction = async () => {
        if (!file || !athlete) {
            setError("Please choose an athlete and select a movement clip first.");
            return;
        }

        try {
            setError("");
            setAnalysis(null);
            setRunning(true);

            const formData = new FormData();
            formData.append("video", file);
            formData.append("athlete", athlete);
            formData.append("sport", sport);

            const response = await API.post("/videos/upload", formData);
            setAnalysis(response.data.analysis);
            setFile(null);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Prediction and screening failed");
        } finally {
            setRunning(false);
        }
    };

    const isAthlete = userRole === "athlete";

    return (
        <div>
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Analysis / Prediction</p>
                    <h1>Injury risk prediction</h1>
                    <p>Run a focused screening from a sports movement video.</p>
                </div>
                <Link className="btn btn-secondary" to="/upload-video">Upload session</Link>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <div className="split-layout">
                <section className="card card-pad">
                    <div className="card-title">
                        <div>
                            <h2>Prediction input</h2>
                            <p>Choose a clip and connect to an athlete to begin screening.</p>
                        </div>
                    </div>

                    <div className="form-field" style={{marginBottom: 16}}>
                        <label htmlFor="athlete-select">Athlete</label>
                        <select 
                            className="field-input" 
                            id="athlete-select" 
                            value={athlete} 
                            onChange={(event) => setAthlete(event.target.value)}
                            disabled={isAthlete}
                        >
                            <option value="">Select athlete</option>
                            {athletes.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.name} · {item.sport}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field" style={{marginBottom: 20}}>
                        <label htmlFor="sport-input">Movement type</label>
                        <input 
                            className="field-input" 
                            id="sport-input" 
                            value={sport} 
                            onChange={(event) => setSport(event.target.value)} 
                            placeholder="e.g. Knee extension, cutting drill" 
                            disabled={isAthlete && athlete !== ""}
                        />
                    </div>

                    <div className="upload-zone">
                        <strong>{file ? file.name : "Select a movement clip"}</strong>
                        <p>Use a clear side or front view for the strongest result.</p>
                        <input 
                            type="file" 
                            accept="video/*" 
                            onChange={(event) => { 
                                setFile(event.target.files[0]); 
                                setAnalysis(null); 
                            }} 
                        />
                    </div>

                    <button 
                        className="btn btn-primary" 
                        style={{width: "100%", marginTop: 20}} 
                        disabled={!file || !athlete || running} 
                        onClick={handleRunPrediction}
                    >
                        {running ? "Running prediction..." : "Run prediction"}
                    </button>
                </section>

                <section className="card card-pad">
                    <div className="card-title">
                        <div>
                            <h2>Risk signal</h2>
                            <p>AI output will appear here after processing.</p>
                        </div>
                    </div>

                    {running ? (
                        <div className="empty-state">Running AI pose estimation and risk prediction models...</div>
                    ) : analysis ? (
                        <>
                            <div style={{display: "flex", alignItems: "center", gap: 18, margin: "28px 0"}}>
                                <div style={{
                                    font: "700 48px Montserrat", 
                                    color: analysis.riskScore >= 70 ? "var(--danger)" : analysis.riskScore >= 40 ? "var(--warning)" : "var(--teal)"
                                }}>
                                    {analysis.riskScore}%
                                </div>
                                <div>
                                    <strong>{analysis.mlPrediction || "Prediction complete"}</strong>
                                    <p style={{margin: "6px 0 0", color: "var(--muted)", fontSize: 13}}>
                                        Movement quality is evaluated as {analysis.movementQuality.toLowerCase()}.
                                        {analysis.recommendations && analysis.recommendations.length > 0 ? ` Recommendation: ${analysis.recommendations[0]}` : ""}
                                    </p>
                                </div>
                            </div>
                            <span className={`badge badge-${analysis.riskScore >= 70 ? 'high' : analysis.riskScore >= 40 ? 'medium' : 'low'}`}>
                                Screening complete
                            </span>
                        </>
                    ) : (
                        <div className="empty-state">No prediction available yet. Select input above to start.</div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Prediction;
