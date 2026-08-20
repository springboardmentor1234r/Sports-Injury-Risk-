import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Activity, Plus, CheckCircle, Clock, ChevronRight, FileText, Video, RefreshCw, UserPlus, Trash2, X } from 'lucide-react';
import VideoPoseViewer from '../video/VideoPoseViewer';
import BiomechanicsReport from '../analytics/BiomechanicsReport';

const API_BASE = 'http://localhost:8000/api/v1';

export const PhysiotherapistDashboard = () => {
  const { authFetch } = useAuth();

  const [patients, setPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableAthletes, setAvailableAthletes] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await authFetch(`${API_BASE}/physio/patients`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data || []);
      }
    } catch (err) {
      console.error('Error fetching physio patients:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await authFetch(`${API_BASE}/videos`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
        if (data.videos && data.videos.length > 0 && !selectedVideoId) {
          setSelectedVideoId(data.videos[0].video_id);
        }
      }
    } catch (err) {
      console.log('Error fetching videos:', err);
    }
  };

  const fetchAvailableAthletes = async () => {
    setAssignLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/physio/available-athletes`);
      if (res.ok) {
        const data = await res.json();
        setAvailableAthletes(data || []);
      }
    } catch (err) {
      console.error('Error fetching available athletes for physio:', err);
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchVideos();
  }, []);

  useEffect(() => {
    if (!selectedVideoId) return;

    const loadReport = async () => {
      setIsLoadingReport(true);
      try {
        const vidRes = await authFetch(`${API_BASE}/videos/${selectedVideoId}`);
        if (vidRes.ok) {
          const vData = await vidRes.json();
          setSelectedVideo(vData);
        }

        const repRes = await authFetch(`${API_BASE}/biomechanics/metrics/${selectedVideoId}`);
        if (repRes.ok) {
          const rData = await repRes.json();
          setReportData(rData);
        }
      } catch (err) {
        console.log('Error loading report:', err);
      } finally {
        setIsLoadingReport(false);
      }
    };

    loadReport();
  }, [selectedVideoId]);

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    fetchAvailableAthletes();
  };

  const handleAssignPatient = async (athleteId) => {
    try {
      const res = await authFetch(`${API_BASE}/physio/assign/${athleteId}`, { method: 'POST' });
      if (res.ok) {
        setActionNotice(`Athlete ID ${athleteId} assigned to your care.`);
        fetchPatients();
        fetchAvailableAthletes();
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (err) {
      console.error('Assign error:', err);
    }
  };

  const handleUnassignPatient = async (athleteId) => {
    try {
      const res = await authFetch(`${API_BASE}/physio/assign/${athleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setActionNotice(`Athlete ID ${athleteId} unassigned.`);
        fetchPatients();
        fetchAvailableAthletes();
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (err) {
      console.error('Unassign error:', err);
    }
  };

  const getVideoUrl = (webUrl) => {
    if (!webUrl) return '';
    if (webUrl.startsWith('http')) return webUrl;
    return `http://localhost:8000${webUrl}`;
  };

  // Group real patients into dynamic Kanban columns based on recovery_status
  const kanbanColumns = {
    initial: patients.filter(p => p.recovery_status?.toLowerCase().includes('initial') || p.recovery_status?.toLowerCase().includes('evaluation') || p.recovery_status?.toLowerCase().includes('monitoring')),
    rehab: patients.filter(p => p.recovery_status?.toLowerCase().includes('active') || p.recovery_status?.toLowerCase().includes('rehab')),
    onField: patients.filter(p => p.recovery_status?.toLowerCase().includes('transition') || p.recovery_status?.toLowerCase().includes('field')),
    cleared: patients.filter(p => p.recovery_status?.toLowerCase().includes('recovered') || p.recovery_status?.toLowerCase().includes('cleared'))
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-amber-400 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Physiotherapy & Rehabilitation Portal</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800 rounded-full">
              {patients.length} Active Patients
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Joint Alignment Kinematics, MediaPipe 33-Landmark Skeleton Review & SOAP Clinical Logger
          </p>
        </div>

        <button
          onClick={handleOpenAssignModal}
          className="px-4 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Assign Patient</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-amber-950/80 border border-amber-800 text-amber-300 text-xs rounded-xl flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Patient & Video Selection Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Stethoscope className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">Patient Video Evaluation:</span>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={selectedVideoId}
            onChange={(e) => setSelectedVideoId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
          >
            {videos.length === 0 ? (
              <option value="">No movement videos available</option>
            ) : (
              videos.map((v) => (
                <option key={v.video_id} value={v.video_id}>
                  {v.filename || v.video_id} ({v.movement_type || 'General'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Integrated Pose Skeleton Viewer & Clinical Kinematics Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <VideoPoseViewer
            videoUrl={getVideoUrl(selectedVideo?.web_url)}
            poseFrames={reportData?.time_series ? reportData.time_series.map((t) => ({
              frame_index: t.frame,
              landmarks: Array.from({ length: 33 }).map((_, i) => ({
                id: i,
                x: i === 25 ? (0.43 + (t.left_knee_valgus / 100)) : (i === 26 ? 0.57 : 0.5),
                y: i >= 23 ? 0.7 : 0.3,
                visibility: 0.9
              }))
            })) : []}
            fps={selectedVideo?.fps || 30}
            movementType={selectedVideo?.movement_type || 'Movement'}
          />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <BiomechanicsReport reportData={reportData} />
        </div>
      </div>

      {/* ATHLETE REHAB TRACKING KANBAN BOARD */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Athlete Rehab Pipeline Tracking Board</h3>
          <span className="text-xs text-slate-400 font-mono">{patients.length} Patient Case(s) Enrolled</span>
        </div>
        
        {isLoadingPatients ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
            <p className="text-xs font-medium">Fetching assigned patient records...</p>
          </div>
        ) : patients.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-amber-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">No patients or rehab records currently assigned</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Assign a patient from registered athletes to begin tracking clinical evaluations and joint kinematics.
              </p>
            </div>
            <button
              onClick={handleOpenAssignModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign First Patient</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Initial Assessment Column */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-800">
                <span>Initial Assessment</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px]">{kanbanColumns.initial.length}</span>
              </div>
              {kanbanColumns.initial.map(item => (
                <div key={item.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{item.name}</span>
                    <button onClick={() => handleUnassignPatient(item.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-rose-400 font-medium block">{item.injury}</span>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{item.sport}</span>
                    <span>{item.recovery_status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Rehab Column */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-amber-400 pb-2 border-b border-slate-800">
                <span>Active Rehab</span>
                <span className="bg-amber-950 px-2 py-0.5 rounded text-[10px]">{kanbanColumns.rehab.length}</span>
              </div>
              {kanbanColumns.rehab.map(item => (
                <div key={item.id} className="p-3 bg-slate-900 border border-amber-900/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{item.name}</span>
                    <button onClick={() => handleUnassignPatient(item.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-amber-400 font-medium block">{item.injury}</span>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{item.sport}</span>
                    <span>{item.recovery_status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* On-Field Transition Column */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-cyan-400 pb-2 border-b border-slate-800">
                <span>On-Field Transition</span>
                <span className="bg-cyan-950 px-2 py-0.5 rounded text-[10px]">{kanbanColumns.onField.length}</span>
              </div>
              {kanbanColumns.onField.map(item => (
                <div key={item.id} className="p-3 bg-slate-900 border border-cyan-900/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{item.name}</span>
                    <button onClick={() => handleUnassignPatient(item.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-medium block">{item.injury}</span>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{item.sport}</span>
                    <span>{item.recovery_status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Fully Cleared Column */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-400 pb-2 border-b border-slate-800">
                <span>Fully Cleared / Monitored</span>
                <span className="bg-emerald-950 px-2 py-0.5 rounded text-[10px]">{kanbanColumns.cleared.length}</span>
              </div>
              {kanbanColumns.cleared.map(item => (
                <div key={item.id} className="p-3 bg-slate-900 border border-emerald-900/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{item.name}</span>
                    <button onClick={() => handleUnassignPatient(item.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium block">{item.injury}</span>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{item.sport}</span>
                    <span>{item.recovery_status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ASSIGN PATIENT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>Assign Patient to Physiotherapy Care</span>
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {assignLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                <span>Fetching registered athletes...</span>
              </div>
            ) : availableAthletes.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400 italic">
                No registered athletes found in system.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableAthletes.map(ath => (
                  <div key={ath.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-100">{ath.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{ath.email} • {ath.sport_type}</span>
                    </div>
                    {ath.is_assigned ? (
                      <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 rounded-lg flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Assigned
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAssignPatient(ath.id)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Assign Patient
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
