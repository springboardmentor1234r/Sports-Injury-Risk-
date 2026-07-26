import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AnalysisReportCard from '../components/analysis/AnalysisReportCard';
import AnalysisSummaryCard from '../components/analysis/AnalysisSummaryCard';
import ExerciseRecommendationCard from '../components/analysis/ExerciseRecommendationCard';
import FrameTimeline from '../components/analysis/FrameTimeline';
import JointAngleTable from '../components/analysis/JointAngleTable';
import MetadataCard from '../components/analysis/MetadataCard';
import RiskPredictionCard from '../components/analysis/RiskPredictionCard';
import { getAnalysisHistoryById } from '../services/analysisHistoryService';

const AnalysisDetails = () => {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { getAnalysisHistoryById(id).then(setRecord).catch((requestError) => setError(requestError?.response?.data?.message || 'Analysis report could not be loaded.')); }, [id]);
  if (error) return <div className="space-y-4"><Link to="/analysis-history" className="text-sm font-semibold text-brand-300">← Back to history</Link><div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div></div>;
  if (!record) return <div className="text-sm text-slate-400">Loading complete analysis report…</div>;
  const data = record.rawResponse?.data;
  return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Link to="/analysis-history" className="text-sm font-semibold text-brand-300">← Back to history</Link><h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Analysis Details</h1><p className="mt-1 text-sm text-slate-400">{record.athleteId?.fullName || 'Athlete'} · {record.video?.originalFileName}</p></div><button disabled title="PDF export is prepared for a future report renderer" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-500">PDF Export (Coming Soon)</button></div><section className="glass-panel rounded-2xl border border-slate-800 p-5"><h2 className="text-lg font-bold text-white">Original Video</h2><video controls preload="metadata" className="mt-4 w-full rounded-xl bg-black" src={record.video?.filePath}><track kind="captions" /></video></section><AnalysisSummaryCard report={data?.analysisReport} /><RiskPredictionCard prediction={data?.riskPrediction} /><ExerciseRecommendationCard recommendations={data?.exerciseRecommendations} /><AnalysisReportCard report={data?.analysisReport} /><JointAngleTable frames={data?.frames} /><FrameTimeline frames={data?.frames} /><MetadataCard metadata={data?.analysisReport?.analysisMetadata} /></div>;
};

export default AnalysisDetails;

