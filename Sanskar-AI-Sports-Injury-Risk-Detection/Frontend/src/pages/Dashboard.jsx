import React, { useState } from 'react';
import AnalysisUploadForm from '../components/analysis/AnalysisUploadForm';
import AnalysisSummaryCard from '../components/analysis/AnalysisSummaryCard';
import RiskPredictionCard from '../components/analysis/RiskPredictionCard';
import ExerciseRecommendationCard from '../components/analysis/ExerciseRecommendationCard';
import AnalysisReportCard from '../components/analysis/AnalysisReportCard';
import JointAngleTable from '../components/analysis/JointAngleTable';
import FrameTimeline from '../components/analysis/FrameTimeline';
import MetadataCard from '../components/analysis/MetadataCard';
import { formatConfidence, formatRiskScore, getRiskBadgeClass } from '../components/analysis/analysisFormatters';
import { runPoseAnalysis } from '../services/analysisService';

const Dashboard = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (video) => {
    setLoading(true);
    setError('');
    try {
      setAnalysisData(await runPoseAnalysis(video));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || 'Analysis could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const report = analysisData?.analysisReport;
  const metadata = report?.analysisMetadata;
  const statistics = [
    ['Risk Level', report?.riskLevel || 'Unavailable', getRiskBadgeClass(report?.riskLevel)],
    ['Risk Score', formatRiskScore(report?.riskScore), 'text-white'],
    ['Frames Analyzed', metadata?.framesAnalyzed ?? 'Unavailable', 'text-white'],
    ['Analysis Confidence', formatConfidence(metadata?.analysisConfidence), 'text-white'],
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white sm:text-3xl">AI Analysis Dashboard</h1><p className="mt-2 text-sm text-slate-400">Review the complete pose, movement, risk, recommendation, and report response for a training video.</p></div>
      <AnalysisUploadForm onAnalyze={handleAnalyze} loading={loading} />
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {loading && <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8 text-center text-sm text-brand-200">Processing video analysis. This can take a moment for longer clips…</div>}
      {!loading && !analysisData && !error && <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center text-sm text-slate-400">Choose a supported video and run analysis to view the returned AI results.</div>}
      {analysisData && !loading && <div className="space-y-6">
        <section><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statistics.map(([label, value, className]) => <div key={label} className="glass-card rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-2 text-lg font-bold ${className}`}>{value}</p></div>)}</div><div className="mt-4"><AnalysisSummaryCard report={report} /></div></section>
        <RiskPredictionCard prediction={analysisData.riskPrediction} />
        <ExerciseRecommendationCard recommendations={analysisData.exerciseRecommendations} />
        <AnalysisReportCard report={report} />
        <JointAngleTable frames={analysisData.frames} />
        <FrameTimeline frames={analysisData.frames} />
        <MetadataCard metadata={metadata} />
      </div>}
    </div>
  );
};

export default Dashboard;
