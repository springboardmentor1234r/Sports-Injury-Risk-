import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Filter, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { getHistory } from '../services/milestone4Api';
import ReportLoading from '../components/ReportLoading';

const AnalysisHistory = () => {
  const { athleteId } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);
  
  // Filtering states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const navigate = useNavigate();

  const handleApplyFilter = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // Validation
    if (!startDate || !endDate) {
      setError('Please select both a Start Date and an End Date.');
      return;
    }

    if (startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }

    setLoading(true);
    const params = {
      start_date: `${startDate}T00:00:00.000Z`,
      end_date: `${endDate}T23:59:59.999Z`
    };

    try {
      const data = await getHistory(athleteId, params);
      setHistory(data.history || []);
      setHasAppliedFilter(true);
    } catch (err) {
      console.error("History fetch failed:", err);
      const detail = err.response?.data?.detail || "Failed to load athlete history records.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setHistory([]);
    setHasAppliedFilter(false);
    setError('');
  };

  // Sorting for chronologically rendered records
  const chronologicalHistory = [...history].sort((a, b) => new Date(a.analysis_date) - new Date(b.analysis_date));

  return (
    <div className="min-h-screen bg-hud-black text-hud-primary flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <header className="hud-glass-panel rounded-none border-b border-hud-border px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-3 py-1.5 border border-hud-border rounded-lg text-xs font-bold bg-hud-dark/30 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-hud-primary uppercase block leading-none">
              Athlete Analysis Logs
            </h1>
            <span className="text-[10px] text-hud-muted block leading-none mt-0.5">
              Historical movement scores & fatigue progression index
            </span>
          </div>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="flex-1 p-6 md:p-8 space-y-6 w-full max-w-full">
        
        {/* FILTER BAR CARD */}
        <div className="hud-glass-panel p-5 space-y-3">
          <form onSubmit={handleApplyFilter} className="flex flex-wrap items-end gap-4 text-xs">
            <div className="flex items-center gap-2 text-hud-secondary">
              <Filter className="w-4 h-4 text-hud-blue" />
              <span className="font-bold uppercase tracking-wider text-[10px]">Filter Windows</span>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-hud-muted font-bold block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-hud px-3 py-1.5 bg-hud-dark/30 border border-hud-border rounded text-xs text-hud-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-hud-muted font-bold block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-hud px-3 py-1.5 bg-hud-dark/30 border border-hud-border rounded text-xs text-hud-primary"
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit"
                className="px-4 py-1.5 bg-hud-blue text-white hover:bg-hud-blue/85 font-bold rounded cursor-pointer"
              >
                Apply
              </button>
              <button 
                type="button"
                onClick={handleClearFilter}
                className="px-4 py-1.5 border border-hud-border hover:bg-hud-dark/45 font-bold rounded cursor-pointer text-hud-secondary"
              >
                Clear
              </button>
            </div>
          </form>

          {error && (
            <div className="flex items-center gap-2 text-hud-danger text-xs pt-2 border-t border-hud-border/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <ReportLoading message="Parsing historical session summaries for date range..." />
        ) : !hasAppliedFilter ? (
          /* INITIAL EMPTY / INSTRUCTION STATE */
          <div className="hud-glass-panel p-12 text-center text-hud-muted text-xs flex flex-col items-center justify-center gap-3">
            <Calendar className="w-10 h-10 text-hud-blue/60" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-hud-primary">Select a start and end date to view analysis logs.</h3>
              <p className="text-xs text-hud-muted">
                Specify a date window above and click "Apply" to load and view the athlete's historical analysis directory.
              </p>
            </div>
          </div>
        ) : history.length === 0 ? (
          /* NO RECORDS IN DATE RANGE STATE */
          <div className="hud-glass-panel p-12 text-center text-hud-muted text-xs flex flex-col items-center justify-center gap-3">
            <BarChart3 className="w-10 h-10 text-gray-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-hud-primary">No historical analysis available for the selected date range.</h3>
              <p className="text-xs text-hud-muted">
                Try expanding your start and end dates to include completed sessions.
              </p>
            </div>
          </div>
        ) : (
          /* HISTORICAL SESSION DIRECTORY (TABLE) */
          <div className="hud-glass-panel overflow-hidden">
            <div className="p-4 border-b border-hud-border flex items-center justify-between bg-hud-dark/15">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-hud-blue" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-hud-primary">
                  Historical Session Directory
                </h4>
              </div>
              <span className="text-[11px] text-hud-muted">
                Filtered Sessions ({chronologicalHistory.length})
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-hud-dark/30 text-hud-muted font-bold border-b border-hud-border">
                    <th className="p-3">Analysis Date</th>
                    <th className="p-3">Session ID</th>
                    <th className="p-3 text-center">Injury Risk</th>
                    <th className="p-3 text-center">Risk Category</th>
                    <th className="p-3 text-center">Health Score</th>
                    <th className="p-3 text-center">Movement Quality</th>
                    <th className="p-3">Active Report</th>
                  </tr>
                </thead>
                <tbody>
                  {[...chronologicalHistory].reverse().map((item) => (
                    <tr key={item.session_id} className="border-b border-hud-border/60 hover:bg-hud-dark/15 transition-all">
                      <td className="p-3 font-hud-mono whitespace-nowrap text-hud-primary">
                        {new Date(item.analysis_date).toLocaleString()}
                      </td>
                      <td className="p-3 font-hud-mono text-hud-secondary">{item.session_id}</td>
                      <td className="p-3 text-center font-hud-mono font-bold text-hud-danger">
                        {item.injury_risk_score.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center uppercase font-bold text-[10px]">
                        <span className={`px-2 py-0.5 rounded border ${
                          item.risk_category === 'Critical' ? 'bg-hud-danger/10 border-hud-danger/20 text-hud-danger' :
                          item.risk_category === 'High' ? 'bg-hud-warning/10 border-hud-warning/20 text-hud-warning' :
                          'bg-hud-green/10 border-hud-green/20 text-hud-green'
                        }`}>
                          {item.risk_category}
                        </span>
                      </td>
                      <td className="p-3 text-center font-hud-mono font-bold text-hud-green">
                        {item.athlete_health_score.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center font-hud-mono font-bold text-hud-blue">
                        {item.movement_quality_score.toFixed(1)}%
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => navigate(`/milestone4/report/${item.session_id}`)}
                          className="px-2 py-1 bg-hud-blue/15 hover:bg-hud-blue text-hud-blue hover:text-white border border-hud-blue/30 rounded text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Open Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AnalysisHistory;
