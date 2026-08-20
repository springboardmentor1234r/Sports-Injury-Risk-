import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, Printer, AlertTriangle, 
  FileText, ShieldCheck, ShieldAlert 
} from 'lucide-react';
import { getReport, generateReport } from '../services/milestone4Api';
import ReportHeader from '../components/ReportHeader';
import RiskSummaryCard from '../components/RiskSummaryCard';
import AthleteHealthCard from '../components/AthleteHealthCard';
import InjuryRiskSummary from '../components/InjuryRiskSummary';
import AnomalySummary from '../components/AnomalySummary';
import RecommendationSummary from '../components/RecommendationSummary';
import DataLimitations from '../components/DataLimitations';
import ReportLoading from '../components/ReportLoading';

const AthleteReport = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const navigate = useNavigate();

  const loadReport = async (autoGen = false) => {
    setLoading(true);
    setError('');
    try {
      const data = await getReport(sessionId);
      setReport(data);
    } catch (err) {
      console.error("Report loading failed:", err);
      const detail = err.response?.data?.detail || "Failed to load report.";
      
      // If report doesn't exist, offer automatic generation or show error
      if (err.response?.status === 404 && autoGen) {
        handleGenerateReport();
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadReport(true);
    }
  }, [sessionId]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError('');
    try {
      const data = await generateReport(sessionId);
      setReport(data);
    } catch (err) {
      console.error("Report generation failed:", err);
      const detail = err.response?.data?.detail || "Failed to generate report.";
      setError(detail);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || generating) {
    return <ReportLoading message={generating ? "Generating new evaluation report..." : "Fetching athlete report..."} />;
  }

  return (
    <div className="min-h-screen bg-hud-black text-white flex flex-col font-sans">
      
      {/* HEADER BAR (HIDDEN IN PRINT) */}
      <header className="hud-glass-panel rounded-none border-b border-hud-border px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-3 py-1.5 border border-hud-border rounded-lg text-xs font-bold bg-hud-dark/30 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-white uppercase block leading-none">
              Evaluation Reports
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="px-3 py-1.5 border border-hud-border rounded-lg text-xs font-bold bg-hud-dark/30 hover:bg-hud-dark/75 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button 
            onClick={() => loadReport(false)}
            className="px-3 py-1.5 bg-hud-blue hover:bg-hud-blue/85 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* ERROR PANEL */}
      {error ? (
        <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
          <div className="hud-glass-panel p-6 max-w-md w-full border-hud-danger/25 bg-hud-danger/5 space-y-4">
            <div className="flex items-center gap-2 text-hud-danger">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Report Evaluation Error
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{error}</p>
            
            {error.includes("generate") || error.includes("not found") ? (
              <button 
                onClick={handleGenerateReport}
                className="w-full py-2 bg-hud-blue hover:bg-hud-blue/85 text-white font-bold rounded-lg text-xs cursor-pointer flex justify-center items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Trigger Report Generation</span>
              </button>
            ) : null}
          </div>
        </main>
      ) : report ? (
        <main className="flex-1 px-6 md:px-8 py-6 space-y-6 w-full max-w-full">
          
          {/* HEADER DETAILS */}
          <ReportHeader 
            athleteId={report.athlete_id} 
            sessionId={report.session_id} 
            date={report.analysis_timestamp} 
          />

          {/* ROW 1: PRIMARY ASSESSMENT & JOINT SUSCEPTIBILITY (2-COLUMN GRID) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskSummaryCard 
              score={report.overall_injury_risk_score} 
              category={report.risk_category} 
            />
            <InjuryRiskSummary risks={report.injury_specific_risks} />
          </div>

          {/* ROW 2: ATHLETE HEALTH & BIOMECHANICAL TELEMETRY (FULL WIDTH GRID) */}
          <AthleteHealthCard 
            healthScore={report.athlete_health_score} 
            qualityScore={report.movement_quality_score} 
            biomechSummary={report.biomechanical_summary} 
          />

          {/* ROW 3: RECOMMENDATIONS & TECHNIQUE ANOMALIES (2-COLUMN GRID) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecommendationSummary recommendations={report.recommendations} />
            <div className="space-y-6">
              <AnomalySummary anomalies={report.movement_anomalies} />
              <DataLimitations limitations={report.data_limitations} />
            </div>
          </div>

        </main>

      ) : (
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-gray-500 text-xs font-hud-mono">No active report loaded.</div>
        </main>
      )}

    </div>
  );
};

export default AthleteReport;
