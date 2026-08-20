import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Activity, Play, RefreshCw, 
  Database, AlertCircle, CheckCircle, ExternalLink
} from 'lucide-react';
import api from '../../../frontend/src/utils/api';
import Button from '../../../frontend/src/components/Button';
import Card from '../../../frontend/src/components/Card';
import Input from '../../../frontend/src/components/Input';
import { runPipeline, getPipelineStatus } from '../services/pipelineApi';
import PipelineStatus from '../components/PipelineStatus';

const PipelineMonitor = () => {
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [activeSessionId, setActiveSessionId] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);

  const navigate = useNavigate();

  // Load completed sessions from DB so user can choose one to run
  const fetchCompletedSessions = async () => {
    try {
      const response = await api.get('/athletes'); // Lists registry
      const list = Array.isArray(response.data) ? response.data : (response.data?.athletes || []);
      
      // Look up sessions from the database
      const sessionsRes = await api.get('/athletes'); // Fallback or search
      // Query sessions collections directly if endpoint exists, or let user type it
    } catch (err) {
      console.log("Could not load athlete lists, default to manual session input.");
    }
  };

  useEffect(() => {
    fetchCompletedSessions();
  }, []);

  // Poll status endpoint while PROCESSING or PENDING
  useEffect(() => {
    let intervalId;
    if (polling && activeSessionId) {
      intervalId = setInterval(async () => {
        try {
          const statusRes = await getPipelineStatus(activeSessionId);
          setStatusData(statusRes);
          
          if (statusRes.status === 'COMPLETED' || statusRes.status === 'FAILED') {
            setPolling(false);
          }
        } catch (err) {
          console.error("Polling error:", err);
          setPolling(false);
          setError("Failed to fetch pipeline status updates.");
        }
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [polling, activeSessionId]);

  const handleStartPipeline = async (e) => {
    if (e) e.preventDefault();
    if (!sessionIdInput.trim()) {
      setError("Please input a valid session identifier.");
      return;
    }

    setLoading(true);
    setError('');
    setStatusData(null);
    const targetSessionId = sessionIdInput.trim();

    try {
      // 1. Fire execution POST call
      const initRes = await runPipeline(targetSessionId);
      setStatusData(initRes);
      setActiveSessionId(targetSessionId);
      
      if (initRes.status === 'PROCESSING' || initRes.status === 'PENDING') {
        setPolling(true);
      }
    } catch (err) {
      console.error("Failed to start pipeline:", err);
      const detail = err.response?.data?.detail || "Invalid Session ID or access forbidden.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hud-black text-white flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="hud-glass-panel rounded-none border-b border-hud-border px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="p-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-white uppercase block">
              Milestone 3 Pipeline Monitor
            </h1>
            <span className="text-[10px] text-gray-500 block leading-none mt-0.5">
              Isolated Pipeline Trigger & Progress Monitor
            </span>
          </div>
        </div>
      </header>

      {/* CONTAINER */}
      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-2xl mx-auto w-full">
        
        {/* INPUT FORM CARD */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-hud-border pb-3">
            <Database className="w-4.5 h-4.5 text-hud-blue" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Trigger Motion Intelligence Pipeline
            </h3>
          </div>

          <form onSubmit={handleStartPipeline} className="space-y-4">
            <Input
              label="Completed Session ID"
              placeholder="e.g. 60c72b2f9b1d8b2bad034341"
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              required
            />
            
            <Button 
              type="submit" 
              className="w-full flex justify-center items-center gap-2 font-bold cursor-pointer"
              disabled={loading || polling}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{polling ? "Pipeline Processing..." : "Launch Pipeline"}</span>
            </Button>
          </form>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-hud-danger/10 border border-hud-danger/25 text-xs text-hud-danger leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </Card>

        {/* STATUS CARD */}
        {statusData && (
          <div className="space-y-4">
            <PipelineStatus pipelineState={statusData} />

            {statusData.status === 'COMPLETED' && (
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => navigate(`/milestone3/intelligence/${activeSessionId}`)}
                  className="flex items-center gap-2 bg-hud-green hover:bg-hud-green/85 cursor-pointer text-xs"
                >
                  <span>View Intelligence Results</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default PipelineMonitor;
