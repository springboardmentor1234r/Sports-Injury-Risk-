import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Download, Database, BarChart2, RefreshCw, Layers, CheckCircle2, FileSpreadsheet } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

export const SportsScientistDashboard = () => {
  const { authFetch } = useAuth();

  const [datasetStatus, setDatasetStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ingestLoading, setIngestLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/sports-scientist/datasets`);
      if (res.ok) {
        const data = await res.json();
        setDatasetStatus(data);
      }
    } catch (e) {
      console.error("Error fetching dataset stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleIngestTrigger = async () => {
    setIngestLoading(true);
    try {
      await authFetch(`${API_BASE}/datasets/ingest`, { method: 'POST' });
      await fetchStatus();
    } catch (e) {
      console.error("Error triggering dataset ingestion:", e);
    } finally {
      setIngestLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-purple-400 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Sports Science Analytics & Ingestion Lab</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-950 text-purple-400 border border-purple-800 rounded-full">
              5 Baseline Datasets Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Human3.6M 3D Joint Tracking, COCO 17-Keypoint Models & FIFA Epidemiological Benchmarks
          </p>
        </div>

        {/* Data Export Controls */}
        <div className="flex items-center space-x-3">
          <button className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl transition-all flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel
          </button>
          <button className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Download PDF Report
          </button>
        </div>
      </div>

      {/* BIOMECHANICAL BASELINE DATASET PIPELINE STATUS */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Ingested Biomechanics Datasets Pipeline</h3>
          </div>
          <button
            onClick={handleIngestTrigger}
            disabled={ingestLoading}
            className="px-3 py-1.5 text-xs font-medium bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ingestLoading ? 'animate-spin' : ''}`} />
            {ingestLoading ? 'Re-ingesting Pipeline...' : 'Re-run Ingestion Script'}
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
            <span>Fetching dataset counts...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {datasetStatus?.datasets_available?.map((ds, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">{ds.name}</span>
                <span className="text-xs font-bold text-slate-200 block">{ds.type}</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> {ds.status || 'Ingested'}
                </span>
              </div>
            )) || (
              <div className="col-span-5 text-center text-xs text-slate-500 py-4">No dataset information loaded.</div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Movement Logs (MongoDB)</span>
            <span className="text-lg font-bold text-cyan-400">{datasetStatus?.movement_logs_count ?? 0} Documents</span>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Video Metadata (MongoDB)</span>
            <span className="text-lg font-bold text-purple-400">{datasetStatus?.video_metadata_count ?? 0} Records</span>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Biomechanics Reports</span>
            <span className="text-lg font-bold text-emerald-400">{datasetStatus?.reports_count ?? 0} Generated</span>
          </div>
        </div>
      </div>

      {/* BIOMECHANICAL ANALYTICS CHART LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart Card 1: Kinematic Symmetry Index */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">L/R Kinematic Symmetry Index</h3>
            <span className="text-xs text-purple-400 font-mono">Sprint Acceleration Phase</span>
          </div>

          <div className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>Ground Impact (N/kg)</span>
              <span className="text-emerald-400 font-bold">Left Foot (98%) vs Right Foot (94%)</span>
            </div>

            <div className="flex items-end justify-between h-28 px-4 gap-3 pt-2">
              <div className="w-12 bg-purple-500/80 rounded-t h-[80%]" title="Right Quad"></div>
              <div className="w-12 bg-cyan-400/80 rounded-t h-[92%]" title="Left Quad"></div>
              <div className="w-12 bg-purple-500/80 rounded-t h-[75%]" title="Right Hamstring"></div>
              <div className="w-12 bg-cyan-400/80 rounded-t h-[88%]" title="Left Hamstring"></div>
              <div className="w-12 bg-purple-500/80 rounded-t h-[85%]" title="Right Glute"></div>
              <div className="w-12 bg-cyan-400/80 rounded-t h-[95%]" title="Left Glute"></div>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
              <span>Quad Drive</span>
              <span>Hamstring Flexion</span>
              <span>Glute Extension</span>
            </div>
          </div>
        </div>

        {/* Chart Card 2: Fatigue Degradation Curve */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Fatigue Degradation vs Valgus Drift</h3>
            <span className="text-xs text-rose-400 font-mono">High Risk Zone &gt; 70min</span>
          </div>

          <div className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>Valgus Angle Deviation</span>
              <span className="text-rose-400 font-bold">+6.4° Drift at Min 85</span>
            </div>

            <div className="w-full h-24 my-auto relative flex items-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                <path
                  d="M 0,80 Q 75,70 150,50 T 300,10"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="3"
                  strokeDasharray="4,4"
                />
                <circle cx="225" cy="30" r="5" fill="#f43f5e" />
              </svg>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
              <span>0-30 min (Fresh)</span>
              <span>30-60 min (Moderate)</span>
              <span>60-90 min (High Fatigue)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
