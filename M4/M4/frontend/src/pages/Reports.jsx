import { useEffect, useState } from "react";
import client from "../api/client";
import Icon from "../components/Icon";

const label = value => value?.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());

function saveBlob(data, filename) { const url = window.URL.createObjectURL(new Blob([data])); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url); }

export default function Reports() {
  const [analyses, setAnalyses] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { client.get("/videos").then(response => setAnalyses(response.data.filter(item => item.result))).catch(() => setError("Reports could not be loaded.")); }, []);
  const download = async (analysis, type) => { const key = `${analysis.id}-${type}`; setBusy(key); try { const response = await client.get(`/reports/analysis/${analysis.id}/${type}`, { responseType: "blob" }); saveBlob(response.data, `kineticguard-analysis-${analysis.id}.${type}`); } catch { setError("This report could not be exported. Please try again."); } finally { setBusy(""); } };
  return <section className="page-enter"><div className="page-heading"><div><span className="eyebrow">REPORTING CENTER</span><h1>Share decision-ready insight.</h1><p>Export concise movement, risk, and recommendation reports for the next care or performance conversation.</p></div><span className="report-badge"><Icon name="report" size={18}/>PDF + CSV exports</span></div>{error && <div className="notice-error">{error}</div>}{analyses.length ? <div className="report-grid">{analyses.map(analysis => <article className="report-card" key={analysis.id}><div className="report-card-top"><span className="report-file"><Icon name="report" size={20}/></span><span className={`risk-badge risk-${analysis.result.risk_level}`}>{analysis.result.risk_level} risk</span></div><h3>{analysis.athlete_name}</h3><p>{label(analysis.activity)} · Assessment KG-{String(analysis.id).padStart(5, "0")}</p><div className="report-score"><b>{analysis.result.overall_risk}</b><span>risk score / 100</span></div><div className="report-meta"><span><Icon name="activity" size={15}/>{analysis.result.movement_quality_score}% quality</span><span><Icon name="trend" size={15}/>{analysis.result.symmetry_score}% symmetry</span></div><div className="report-actions"><button onClick={() => download(analysis, "pdf")} disabled={!!busy}>{busy === `${analysis.id}-pdf` ? "Preparing…" : <><Icon name="download" size={16}/>PDF report</>}</button><button onClick={() => download(analysis, "csv")} disabled={!!busy}>{busy === `${analysis.id}-csv` ? "Preparing…" : <><Icon name="download" size={16}/>CSV data</>}</button></div></article>)}</div> : <div className="empty-card"><span className="empty-icon"><Icon name="report" size={30}/></span><h3>No reports yet.</h3><p>Completed movement assessments automatically become exportable reports here.</p></div>}</section>;
}
