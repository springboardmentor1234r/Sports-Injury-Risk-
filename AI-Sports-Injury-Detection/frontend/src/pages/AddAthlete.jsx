import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function AddAthlete() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: "", age: "", gender: "", sport: "", position: "", height: "", weight: "", injuryHistory: "" });
    const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
    const handleSubmit = async (event) => { event.preventDefault(); try { await API.post("/athletes", formData); navigate("/athletes"); } catch (error) { alert(error.response?.data?.message || "Failed to add athlete"); } };
    return <div><div className="page-heading"><div><p className="eyebrow">Roster / New profile</p><h1>Add athlete</h1><p>Capture the baseline your analysis will measure against.</p></div><Link className="btn btn-secondary" to="/athletes">Back to roster</Link></div><section className="card card-pad"><div className="card-title"><div><h2>Athlete details</h2><p>Required information for a reliable movement profile.</p></div></div><form onSubmit={handleSubmit}><div className="form-grid">{[["name", "Full name", "text"], ["age", "Age", "number"], ["gender", "Gender", "text"], ["sport", "Sport", "text"], ["position", "Position", "text"], ["height", "Height (cm)", "number"], ["weight", "Weight (kg)", "number"]].map(([name, label, type]) => <div className="form-field" key={name}><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} value={formData[name]} onChange={handleChange} placeholder={label} required={name === "name"} /></div>)}<div className="form-field full"><label htmlFor="injuryHistory">Previous injury history</label><textarea id="injuryHistory" name="injuryHistory" value={formData.injuryHistory} onChange={handleChange} placeholder="Add relevant history, or leave blank if none." /></div></div><div className="form-actions"><Link className="btn btn-secondary" to="/athletes">Cancel</Link><button className="btn btn-primary">Save athlete</button></div></form></section></div>;
}
export default AddAthlete;
