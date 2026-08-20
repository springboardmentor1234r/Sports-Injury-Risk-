import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Activity, ShieldCheck, ShieldAlert, 
  RefreshCw, AlertCircle, FileText, Compass, Clock,
  Bell, History, ChevronRight
} from 'lucide-react';
import api from '@api';
import Button from '@root/components/Button';
import Card from '@root/components/Card';
import { getCombinedAnalysis } from '@m3/services/intelligenceApi';
import RiskScoreCard from '@m3/components/RiskScoreCard';
import AthleteHealthSummary from '@m3/components/AthleteHealthSummary';
import RiskBreakdown from '@m3/components/RiskBreakdown';
import InjuryRiskCards from '@m3/components/InjuryRiskCards';
import AnomalyList from '@m3/components/AnomalyList';
import RecommendationCards from '@m3/components/RecommendationCards';
import DataLimitations from '@m3/components/DataLimitations';
import RiskTrend from '@m3/components/RiskTrend';
import IntelligenceLoading from '@m3/components/IntelligenceLoading';

const AthleteIntelligence = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [athleteInfo, setAthleteInfo] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Theme state
  const [theme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch current user
      const userRes = await api.get('/me');
      setCurrentUser(userRes.data);

      // 2. Fetch combined analysis (triggers pipeline if not computed)
      const data = await getCombinedAnalysis(sessionId);
      setAnalysisData(data);

      // 3. Fetch AnalysisSession detail from DB
      const sessionRes = await api.get(`/milestone2/analysis/status/${sessionId}`);
      setSessionInfo(sessionRes.data);

      // 4. Fetch athlete details to render profile metadata
      if (sessionRes.data?.athlete_id) {
        try {
          const athRes = await api.get('/athletes');
          const list = Array.isArray(athRes.data) ? athRes.data : (athRes.data?.athletes || []);
          const match = list.find(ath => ath.athlete_id === sessionRes.data.athlete_id || ath._id === sessionRes.data.athlete_id);
          setAthleteInfo(match || null);
        } catch {
          // athlete list may fail for athlete role — ignore silently
        }
      }
    } catch (err) {
      console.error("AthleteIntelligence loading error:", err);
      const detail = err.response?.data?.detail || "Connection to API service lost.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  // Handle Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-hud-black text-white flex flex-col font-sans">
        <header className="hud-glass-panel rounded-none border-b border-hud-border px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-extrabold tracking-wider uppercase">
              Athlete Intelligence Dashboard
            </span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <IntelligenceLoading />
        </div>
      </div>
    );
  }

  // Handle Error/Unauthorized State
  if (error) {
    return (
      <div className="min-h-screen bg-hud-black text-white flex flex-col font-sans">
        <header className="hud-glass-panel rounded-none border-b border-hud-border px-6 py-4 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-extrabold tracking-wider uppercase">
              Athlete Intelligence Dashboard
            </span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="hud-glass-panel p-8 rounded-xl border border-hud-danger/30 max-w-md w-full text-center">
            <ShieldAlert className="w-10 h-10 text-hud-danger mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Access Restrained</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Reload</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Processing State (If Milestone 2 is still running)
  const isCompleted = analysisData?.status === 'completed';
  if (!isCompleted) {
    return (
      <div className="min-h-screen bg-hud-black text-white flex flex-col font-sans">
        <header className="hud-glass-panel rounded-none border-b border-hud-border px-6 py-4 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-extrabold tracking-wider uppercase">
              Athlete Intelligence Dashboard
            </span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="hud-glass-panel p-8 rounded-xl border border-hud-warning/30 max-w-md w-full text-center space-y-4">
            <Clock className="w-10 h-10 text-hud-warning mx-auto animate-spin" />
            <h3 className="text-lg font-bold text-white uppercase">Analysis In Progress</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Biomechanical tracking is currently executing. Once the core posture and coordinate structures complete, intelligence models will unlock automatically.
            </p>
            <div className="text-[10px] text-gray-500 font-hud-mono bg-hud-dark p-2 rounded">
              Current state: {analysisData?.status || 'Processing'}
            </div>
            <Button variant="outline" className="mx-auto" onClick={fetchData}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const riskScore = analysisData?.risk_score || {};
  const scoreBreakdown = riskScore?.score_breakdown || {};
  const dataLimitations = scoreBreakdown?.data_limitations || [];
  const athleteId = athleteInfo?._id || sessionInfo?.athlete_id || '';

  return (
    <div className="min-h-screen bg-hud-black text-white flex flex-col font-sans">
      
      {/* HEADER SECTION */}
      <header className="hud-glass-panel rounded-none border-b border-hud-border px-6 md:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="p-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-wider text-white uppercase">
                Athlete Intelligence Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded bg-hud-green-glow border border-hud-green/30 text-hud-green text-[9px] font-bold uppercase tracking-wider">
                COMPLETED
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Athlete Profile: <span className="text-white font-bold">{athleteInfo?.full_name || 'Anonymous'} ({athleteInfo?.athlete_id || 'N/A'})</span> • Session: <span className="text-hud-blue font-semibold">{sessionInfo?.session_name || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
          <Button variant="outline" className="text-xs" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate</span>
          </Button>
          {/* M4 Navigation Buttons — connect intelligence to report/history/notifications */}
          <Button 
            className="text-xs bg-hud-blue hover:bg-hud-blue/85 text-white border-transparent"
            onClick={() => navigate(`/milestone4/report/${sessionId}`)}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Full Report</span>
          </Button>
          {athleteId && (
            <>
              <Button 
                variant="outline" 
                className="text-xs"
                onClick={() => navigate(`/milestone4/history/${athleteId}`)}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </Button>
              <Button 
                variant="outline" 
                className="text-xs"
                onClick={() => navigate(`/milestone4/notifications/${athleteId}`)}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notifications</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <main className="flex-1 px-6 md:px-8 py-6 space-y-6 w-full max-w-full">
        
        {/* ROW 1: PRIMARY ASSESSMENT & CORE HEALTH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          <div className="lg:col-span-4">
            <RiskScoreCard 
              score={riskScore.overall_injury_risk_score} 
              category={riskScore.risk_category} 
            />
          </div>
          <div className="lg:col-span-8">
            <AthleteHealthSummary 
              healthScore={riskScore.overall_athlete_health_score}
              movementQuality={riskScore.movement_quality_score}
              efficiencyScore={riskScore.biomechanical_efficiency_score}
              fatigueRisk={riskScore.fatigue_risk_score}
            />
          </div>
        </div>

        {/* ROW 2: DETAILED SCORING & SENSOR LIMITATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          <div className="lg:col-span-7">
            <RiskBreakdown 
              scoreBreakdown={scoreBreakdown}
              weightedFactors={riskScore.weighted_factors}
            />
          </div>
          <div className="lg:col-span-5">
            <RiskTrend />
          </div>
        </div>

        {/* ROW 3: DETECTED ANOMALIES & RECOMMENDED ROUTINES */}
        <div className="w-full">
          <AnomalyList 
            anomalies={analysisData.anomalies || []} 
          />
        </div>

        <div className="w-full">
          <InjuryRiskCards 
            predictions={analysisData.injury_risks || []} 
          />
        </div>

        <div className="w-full">
          <RecommendationCards 
            recommendations={analysisData.recommendations || []} 
          />
        </div>

        {/* ROW 4: DATA WARNINGS */}
        {dataLimitations.length > 0 && (
          <div className="w-full">
            <DataLimitations limitations={dataLimitations} />
          </div>
        )}

        {/* ROW 5: CONTINUE TO MILESTONE 4 */}
        <div className="border-t border-hud-border pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Continue to Milestone 4</h3>
              <p className="text-xs text-gray-400 mt-1">Generate the full evaluation report and review notification history.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate(`/milestone4/report/${sessionId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-hud-blue hover:bg-hud-blue/85 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Full Evaluation Report</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              {athleteId && (
                <>
                  <button
                    onClick={() => navigate(`/milestone4/history/${athleteId}`)}
                    className="flex items-center gap-2 px-4 py-2 border border-hud-border hover:border-hud-blue hover:text-hud-blue text-gray-400 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    <History className="w-4 h-4" />
                    <span>Analysis History</span>
                  </button>
                  <button
                    onClick={() => navigate(`/milestone4/notifications/${athleteId}`)}
                    className="flex items-center gap-2 px-4 py-2 border border-hud-border hover:border-hud-blue hover:text-hud-blue text-gray-400 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default AthleteIntelligence;
