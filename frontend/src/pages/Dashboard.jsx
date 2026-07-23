import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity, Users, LogOut, Search, Plus, Filter, Edit, 
  Trash2, ShieldCheck, UserPlus, X, Shield, FileText, Info, 
  User, CheckCircle2, AlertOctagon, RefreshCw, Sun, Moon, Film
} from 'lucide-react';
import api from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { SkeletonRow, SkeletonCard } from '../components/Skeleton';

const BACKEND_URL = 'http://127.0.0.1:8000';
const itemsPerPage = 4;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Athlete CRUD state
  const [athletes, setAthletes] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [listLoading, setListLoading] = useState(false);

  // Self Profile state (Athlete role only)
  const [myProfile, setMyProfile] = useState(null);
  const [myProfileLoading, setMyProfileLoading] = useState(false);

  // Toast notifier
  const [toast, setToast] = useState(null);

  // Modals state
  const [athleteModalOpen, setAthleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [athleteForm, setAthleteForm] = useState({
    athlete_id: '',
    full_name: '',
    age: '',
    gender: 'Male',
    sport: 'Sprinting',
    playing_position: '',
    height: '',
    weight: '',
    training_load: 'Low',
    experience: '',
    fitness_level: 'Intermediate',
    medical_notes: '',
    injury_history: '',
    emergency_contact: '',
    coach_name: '',
    photo: '',
    disability_status: 'No',
    disability_type: '',
    assistive_device: ''
  });

  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync theme changes with document attributes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Fetch user profile on mount
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.get('/me');
      setUser(response.data);
    } catch (err) {
      console.error('Session authentication failure:', err);
      setError('Your session has expired. Please log in again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  // Query Athlete Profile or list from MongoDB
  const fetchRegistry = async () => {
    if (!user) return;
    
    if (user.role === 'Athlete') {
      setMyProfileLoading(true);
      try {
        const response = await api.get('/athletes/my-profile');
        setMyProfile(response.data);
      } catch (err) {
        console.log("Profile lookup via endpoint failed, matching name client-side...");
        try {
          const listResponse = await api.get('/athletes');
          const list = Array.isArray(listResponse.data) 
            ? listResponse.data 
            : (listResponse.data?.athletes || []);
          const match = list.find(
            ath => ath.full_name?.toLowerCase() === user.name?.toLowerCase()
          );
          setMyProfile(match || null);
        } catch (fallbackErr) {
          console.error("Biometric lookup failure:", fallbackErr);
          setMyProfile(null);
        }
      } finally {
        setMyProfileLoading(false);
      }
    } else {
      setListLoading(true);
      try {
        const response = await api.get('/athletes', {
          params: {
            search: searchQuery || undefined,
            sport: sportFilter === 'All' ? undefined : sportFilter,
            gender: genderFilter === 'All' ? undefined : genderFilter,
            page: currentPage,
            limit: itemsPerPage
          }
        });
        
        const data = response.data;
        if (Array.isArray(data)) {
          setAthletes(data);
          setTotalItems(data.length);
          setTotalPages(1);
        } else if (data && Array.isArray(data.athletes)) {
          setAthletes(data.athletes);
          setTotalItems(data.total || data.athletes.length);
          setTotalPages(data.pages || 1);
        } else {
          setAthletes([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Registry Sync Error:", err);
        showToast("Connection to database timed out.", "danger");
      } finally {
        setListLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, [searchQuery, sportFilter, genderFilter, currentPage, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isEditor = user && ['Coach', 'Admin'].includes(user?.role);
  const isAdmin = user && user?.role === 'Admin';

  // Table Column Headers depending on role
  const getTableColumns = () => {
    if (!user) return [];
    switch (user?.role) {
      case 'Coach':
        return ['ID', 'Athlete Name', 'Sport', 'Position', 'Coach', 'Experience', 'Actions'];
      case 'Physiotherapist':
        return ['ID', 'Athlete Name', 'Sport', 'Injury History', 'Medical Notes', 'Actions'];
      case 'Sports Scientist':
        return ['ID', 'Athlete Name', 'Sport', 'Height / Weight', 'Training Load', 'Fitness Level', 'Actions'];
      case 'Admin':
      default:
        return ['ID', 'Athlete Name', 'Sport', 'Position', 'Height / Weight', 'Training Load', 'Fitness Level', 'Actions'];
    }
  };

  // Open creation or edit modal
  const openAthleteModal = (ath = null) => {
    if (ath) {
      setSelectedAthlete(ath);
      setAthleteForm({
        athlete_id: ath.athlete_id,
        full_name: ath.full_name,
        age: ath.age,
        gender: ath.gender,
        sport: ath.sport,
        playing_position: ath.playing_position,
        height: ath.height,
        weight: ath.weight,
        training_load: ath.training_load,
        experience: ath.experience,
        fitness_level: ath.fitness_level,
        medical_notes: ath.medical_notes,
        injury_history: ath.injury_history,
        emergency_contact: ath.emergency_contact,
        coach_name: ath.coach_name,
        photo: ath.photo || '',
        disability_status: ath.disability_status || 'No',
        disability_type: ath.disability_type || '',
        assistive_device: ath.assistive_device || ''
      });
    } else {
      setSelectedAthlete(null);
      setAthleteForm({
        athlete_id: '',
        full_name: user?.role === 'Athlete' ? user.name : '',
        age: '',
        gender: 'Male',
        sport: 'Sprinting',
        playing_position: '',
        height: '',
        weight: '',
        training_load: 'Low',
        experience: '',
        fitness_level: 'Intermediate',
        medical_notes: '',
        injury_history: '',
        emergency_contact: '',
        coach_name: '',
        photo: '',
        disability_status: 'No',
        disability_type: '',
        assistive_device: ''
      });
    }
    setAthleteModalOpen(true);
  };

  // Process profile picture file uploads
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setPhotoUploading(true);
    try {
      const response = await api.post('/athletes/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAthleteForm(prev => ({ ...prev, photo: response.data.photo_url }));
      showToast("Biometric photograph uploaded successfully.", "success");
    } catch (err) {
      console.error("Photo upload failed:", err);
      const msg = err.response?.data?.detail || "Upload failed. Verify image file format.";
      showToast(msg, "danger");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Commit creation or edit updates to MongoDB
  const saveAthlete = async (e) => {
    e.preventDefault();

    try {
      if (selectedAthlete) {
        await api.put(`/athletes/${selectedAthlete._id}`, athleteForm);
        showToast("Profile updated successfully.", "success");
      } else {
        await api.post('/athletes', athleteForm);
        showToast("New profile record saved to database.", "success");
      }
      setAthleteModalOpen(false);
      fetchRegistry();
    } catch (err) {
      console.error("Transaction failed:", err);
      const msg = err.response?.data?.detail || "Transaction failed. Verify parameters.";
      showToast(msg, "danger");
    }
  };

  // Open deletion modal
  const triggerDelete = (ath) => {
    if (!isAdmin) return;
    setSelectedAthlete(ath);
    setDeleteModalOpen(true);
  };

  // Execute deletion request
  const executeDelete = async () => {
    if (!selectedAthlete || !isAdmin) return;
    
    try {
      await api.delete(`/athletes/${selectedAthlete._id}`);
      showToast(`Athlete profile successfully deleted.`, "success");
      setDeleteModalOpen(false);
      if (athletes.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchRegistry();
      }
    } catch (err) {
      console.error("Erasing profile failed:", err);
      showToast("Database deletion rejected.", "danger");
    }
  };

  const openViewModal = (ath) => {
    setSelectedAthlete(ath);
    setViewModalOpen(true);
  };

  // Loading page spinner layout
  if (loading) {
    return (
      <div className="min-h-screen bg-hud-black flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Activity className="animate-spin h-8 w-8 text-hud-blue" />
          <span className="text-hud-blue text-sm font-medium animate-pulse">Loading Platform...</span>
        </div>
      </div>
    );
  }

  // Error landing screen
  if (error) {
    return (
      <div className="min-h-screen bg-hud-black flex items-center justify-center px-4 font-sans">
        <div className="hud-glass-panel p-8 rounded-xl border border-hud-danger/30 max-w-md w-full text-center">
          <Shield className="w-10 h-10 text-hud-danger mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{error}</p>
          <Button variant="outline" className="mx-auto" onClick={fetchUserData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hud-black text-white flex flex-col font-sans">

      {/* TOP HEADER */}
      <header className="hud-glass-panel rounded-none border-b border-hud-border px-6 md:px-10 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-hud-blue flex items-center justify-center shadow-md">
            <Activity className="w-4.5 h-4.5 text-white stroke-[2.5]" />
          </div>
          <div>
            <span className="text-md font-extrabold tracking-wider text-white uppercase block">
              KINETIC<span className="text-hud-green">GUARD</span>
            </span>
            <span className="text-[10px] text-hud-blue font-medium block">
            {  /* Injury Risk & Biometrics Monitor */}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 font-sans text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-hud-green" />
            <span className="border-r border-hud-border pr-3">Welcome, {user?.name}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-hud-blue/15 border border-hud-blue/30 text-hud-blue text-[10px] font-semibold uppercase">{user?.role}</span>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-hud-border hover:border-hud-blue hover:text-hud-blue cursor-pointer transition-colors text-gray-400 bg-hud-dark/50"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-hud-warning" /> : <Moon className="w-4 h-4 text-hud-blue" />}
          </button>

          <Button
            onClick={handleLogout}
            variant="danger"
            className="px-3.5 py-1.5 text-xs rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="lg:w-60 bg-hud-dark/30 border-r border-hud-border p-6 flex flex-col justify-between relative z-20">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase block mb-3">Workspace</span>
              <nav className="space-y-1">
                {user?.role === 'Athlete' ? (
                  <>
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold bg-hud-blue/15 border border-hud-blue/30 text-hud-blue">
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </div>
                    <button
                      onClick={() => navigate('/milestone2/upload')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-hud-dark/50 transition-all cursor-pointer text-left"
                    >
                      <Film className="w-4 h-4 text-gray-500" />
                      <span>Video Upload</span>
                    </button>
                    <button
                      onClick={() => navigate('/milestone2/pose')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-hud-dark/50 transition-all cursor-pointer text-left"
                    >
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span>Pose Ingestion</span>
                    </button>
                    <button
                      onClick={() => navigate('/milestone2/skeleton')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-hud-dark/50 transition-all cursor-pointer text-left"
                    >
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span>Skeleton Tracking</span>
                    </button>
                    <button
                      onClick={() => navigate('/milestone2/biomechanics')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-hud-dark/50 transition-all cursor-pointer text-left"
                    >
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span>Joint Biomechanics</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold bg-hud-blue/15 border border-hud-blue/30 text-hud-blue">
                      <Users className="w-4 h-4" />
                      <span>Athlete Registry</span>
                    </div>
                    <button
                      onClick={() => navigate('/milestone2/upload')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-hud-dark/50 transition-all cursor-pointer text-left"
                    >
                      <Film className="w-4 h-4 text-gray-500" />
                      <span>Video Upload</span>
                    </button>
                    <button
                      onClick={() => navigate('/milestone2/pose')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-hud-dark/50 transition-all cursor-pointer text-left"
                    >
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span>Pose Ingestion</span>
                    </button>
                    <button
                      onClick={() => navigate('/milestone2/skeleton')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-hud-dark/50 transition-all cursor-pointer text-left"
                    >
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span>Skeleton Tracking</span>
                    </button>
                    <button
                      onClick={() => navigate('/milestone2/biomechanics')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-hud-dark/50 transition-all cursor-pointer text-left"
                    >
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span>Joint Biomechanics</span>
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Sidebar metric diagnostics */}
            {user?.role !== 'Athlete' && (
              <div className="p-4 rounded-lg bg-hud-dark/40 border border-hud-border hidden lg:block text-xs space-y-3">
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Overview</span>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Athletes:</span>
                  <span className="text-white font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Storage Sync:</span>
                  <span className="text-hud-green font-semibold">Active</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-hud-border hidden lg:block text-center text-[10px] text-gray-500">
            System version 1.0.0
          </div>
        </aside>

        {/* CONTENT PANEL */}
        <main className="flex-1 p-6 md:p-8 relative z-10 overflow-y-auto">
          
          {/* VIEW MODE: ATHLETE ROLE (READ-ONLY PROFILE VIEW) */}
          {user?.role === 'Athlete' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="border-b border-hud-border pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Biometric Profile
                  </h1>
                  <p className="text-gray-400 text-xs mt-1">
                    Manage and review your physical indicators and health reports.
                  </p>
                </div>
              </div>

              {myProfileLoading ? (
                <div className="grid grid-cols-1 gap-6">
                  <SkeletonCard />
                </div>
              ) : myProfile ? (
                /* Profile details view */
                <Card className="space-y-6 text-sm">
                  
                  {/* Photo details */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-hud-dark/20 border border-hud-border">
                    <div className="w-24 h-24 rounded-lg bg-hud-dark border border-hud-border overflow-hidden flex items-center justify-center flex-shrink-0">
                      {myProfile.photo ? (
                        <img 
                          src={`${BACKEND_URL}${myProfile.photo}`} 
                          alt={myProfile.full_name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <h3 className="text-xl font-bold text-white uppercase">{myProfile.full_name}</h3>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <span className="px-2.5 py-1 rounded bg-hud-blue/15 border border-hud-blue/30 text-hud-blue text-xs font-semibold">
                          Sport: {myProfile.sport}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-hud-green-glow border border-hud-green/30 text-hud-green text-xs font-semibold">
                          Fitness: {myProfile.fitness_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-hud-dark/10 border border-hud-border">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 block">Age / Gender</span>
                      <span className="text-white font-semibold block">{myProfile.age} yrs / {myProfile.gender}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 block">Height / Weight</span>
                      <span className="text-white font-semibold block">{myProfile.height} / {myProfile.weight}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 block">Position</span>
                      <span className="text-white font-semibold block">{myProfile.playing_position}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 block">Training Load</span>
                      <span className="text-hud-green font-semibold block">{myProfile.training_load}</span>
                    </div>
                  </div>

                  {/* Biographical split */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 rounded-lg bg-hud-dark/10 border border-hud-border">
                      <span className="text-xs text-hud-blue uppercase font-bold tracking-wider block border-b border-hud-border pb-1 flex items-center gap-1.5">
                        <Info className="w-4 h-4" />
                        Biographical Metrics
                      </span>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Experience:</span>
                          <span className="text-white">{myProfile.experience}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Coach:</span>
                          <span className="text-white">{myProfile.coach_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Emergency Contact:</span>
                          <span className="text-white">{myProfile.emergency_contact}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 p-4 rounded-lg bg-hud-dark/10 border border-hud-border">
                      <span className="text-xs text-hud-blue uppercase font-bold tracking-wider block border-b border-hud-border pb-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Disability Status
                      </span>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status flag:</span>
                          <span className="text-white font-semibold">{myProfile.disability_status}</span>
                        </div>
                        {myProfile.disability_status === 'Yes' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Type:</span>
                              <span className="text-white">{myProfile.disability_type || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Device:</span>
                              <span className="text-white">{myProfile.assistive_device || 'N/A'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medical / Injury history */}
                  <div className="space-y-4">
                    <div className="space-y-1.5 p-4 rounded-lg bg-hud-dark/15 border border-hud-border">
                      <span className="text-xs text-hud-danger uppercase font-bold tracking-wider block border-b border-hud-danger/20 pb-1 flex items-center gap-1.5">
                        <AlertOctagon className="w-4 h-4" />
                        Injury History
                      </span>
                      <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{myProfile.injury_history}</p>
                    </div>

                    <div className="space-y-1.5 p-4 rounded-lg bg-hud-dark/15 border border-hud-border">
                      <span className="text-xs text-hud-warning uppercase font-bold tracking-wider block border-b border-hud-warning/20 pb-1 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Medical Diagnostics
                      </span>
                      <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{myProfile.medical_notes}</p>
                    </div>
                  </div>

                  {/* Edit My Profile */}
                  <div className="flex justify-end pt-4 border-t border-hud-border">
                    <Button onClick={() => openAthleteModal(myProfile)}>
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit My Profile</span>
                    </Button>
                  </div>

                  <div className="flex justify-between text-[10px] text-gray-500 border-t border-hud-border pt-4">
                    <span>Created By: {myProfile.created_by}</span>
                    <span>Logged At: {new Date(myProfile.created_at).toLocaleString()}</span>
                  </div>

                </Card>
              ) : (
                /* Unsynced state: Create profile option directly for new athletes */
                <Card className="p-8 text-center max-w-md mx-auto border-hud-warning/20">
                  <User className="w-10 h-10 text-hud-warning mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-white uppercase mb-2">Create Biometric Profile</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6">
                    You have not initialized your physical metrics under the identity <span className="text-hud-blue font-bold">"{user?.name}"</span>. Setup your profile to sync your health records.
                  </p>
                  <Button onClick={() => openAthleteModal()} className="mx-auto">
                    <UserPlus className="w-4 h-4" />
                    <span>Create My Profile</span>
                  </Button>
                </Card>
              )}
            </motion.div>
          )}

          {/* VIEW MODE: OPERATOR ROLES (ATHLETE LIST CRUD REGISTRY) */}
          {user?.role !== 'Athlete' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hud-border pb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Athlete Registry
                  </h1>
                  <p className="text-gray-400 text-xs mt-1">
                    Manage profiles, view diagnostics metrics, and record physical files.
                  </p>
                </div>

                {isEditor && (
                  <Button
                    onClick={() => openAthleteModal()}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Athlete</span>
                  </Button>
                )}
              </div>

              {/* SEARCH & FILTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Search input */}
                <div className="sm:col-span-6">
                  <Input
                    type="text"
                    icon={Search}
                    placeholder="Search by ID or athlete name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Sport filter */}
                <div className="sm:col-span-3">
                  <select
                    className="w-full px-4 py-2.5 bg-hud-dark border border-hud-border rounded-lg text-xs appearance-none focus:outline-none focus:border-hud-blue text-white cursor-pointer"
                    value={sportFilter}
                    onChange={(e) => {
                      setSportFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">All Sports</option>
                    <option value="Sprinting">Sprinting</option>
                    <option value="Soccer">Soccer</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Gymnastics">Gymnastics</option>
                    <option value="Baseball">Baseball</option>
                    <option value="Football">Football</option>
                  </select>
                </div>

                {/* Gender filter */}
                <div className="sm:col-span-3">
                  <select
                    className="w-full px-4 py-2.5 bg-hud-dark border border-hud-border rounded-lg text-xs appearance-none focus:outline-none focus:border-hud-blue text-white cursor-pointer"
                    value={genderFilter}
                    onChange={(e) => {
                      setGenderFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* TABLE REGISTRY */}
              <div className="hud-glass-panel rounded-xl border border-hud-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse hud-table">
                    <thead>
                      <tr className="bg-hud-dark/30 font-semibold text-xs text-gray-400 border-b border-hud-border">
                        {getTableColumns().map((col, idx) => (
                          <th key={idx} className="p-4">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hud-border text-xs text-gray-300">
                      {listLoading ? (
                        Array.from({ length: itemsPerPage }).map((_, idx) => (
                          <SkeletonRow key={idx} cols={getTableColumns().length} />
                        ))
                      ) : athletes.length > 0 ? (
                        athletes.map((ath) => (
                          <tr key={ath._id} className="hover:bg-hud-blue/5 transition-colors">
                            
                            {/* Athlete ID */}
                            <td className="p-4 font-semibold text-hud-blue">{ath.athlete_id || 'N/A'}</td>
                            
                            {/* Avatar & Name */}
                            <td className="p-4 font-sans font-semibold text-white flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-hud-dark border border-hud-border overflow-hidden flex items-center justify-center flex-shrink-0">
                                {ath.photo ? (
                                  <img 
                                    src={`${BACKEND_URL}${ath.photo}`} 
                                    alt={ath.full_name} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-gray-500" />
                                )}
                              </div>
                              <span className="truncate">{ath.full_name}</span>
                            </td>
                            
                            {/* Sport */}
                            <td className="p-4 text-gray-300">{ath.sport}</td>
                            
                            {/* Coach Column Layout */}
                            {user?.role === 'Coach' && (
                              <>
                                <td className="p-4 text-gray-400">{ath.playing_position}</td>
                                <td className="p-4 text-gray-400">{ath.coach_name}</td>
                                <td className="p-4 text-gray-400">{ath.experience}</td>
                              </>
                            )}

                            {/* Physiotherapist Column Layout */}
                            {user?.role === 'Physiotherapist' && (
                              <>
                                <td className="p-4 text-gray-400 max-w-[180px] truncate" title={ath.injury_history}>
                                  {ath.injury_history}
                                </td>
                                <td className="p-4 text-gray-400 max-w-[180px] truncate" title={ath.medical_notes}>
                                  {ath.medical_notes}
                                </td>
                              </>
                            )}

                            {/* Sports Scientist Column Layout */}
                            {user?.role === 'Sports Scientist' && (
                              <>
                                <td className="p-4 text-gray-400">{ath.height} / {ath.weight}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    ath.training_load === 'Low' 
                                      ? 'bg-hud-green-glow text-hud-green border border-hud-green/30' 
                                      : ath.training_load === 'Medium' 
                                        ? 'bg-hud-warning/10 text-hud-warning border border-hud-warning/30' 
                                        : 'bg-hud-danger/10 text-hud-danger border border-hud-danger/30'
                                  }`}>
                                    {ath.training_load}
                                  </span>
                                </td>
                                <td className="p-4 text-white font-bold">{ath.fitness_level}</td>
                              </>
                            )}

                            {/* Admin Column Layout */}
                            {user?.role === 'Admin' && (
                              <>
                                <td className="p-4 text-gray-400">{ath.playing_position}</td>
                                <td className="p-4 text-gray-400">{ath.height} / {ath.weight}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    ath.training_load === 'Low' 
                                      ? 'bg-hud-green-glow text-hud-green border border-hud-green/30' 
                                      : ath.training_load === 'Medium' 
                                        ? 'bg-hud-warning/10 text-hud-warning border border-hud-warning/30' 
                                        : 'bg-hud-danger/10 text-hud-danger border border-hud-danger/30'
                                  }`}>
                                    {ath.training_load}
                                  </span>
                                </td>
                                <td className="p-4 text-white font-bold">{ath.fitness_level}</td>
                              </>
                            )}

                            {/* Diagnostics actions column */}
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => openViewModal(ath)}
                                  className="p-1.5 rounded-lg border border-hud-border hover:border-hud-blue hover:bg-hud-blue/10 text-hud-blue cursor-pointer transition-colors"
                                  title="View Details"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>

                                {isEditor && (
                                  <button
                                    onClick={() => openAthleteModal(ath)}
                                    className="p-1.5 rounded-lg border border-hud-border hover:border-hud-green hover:bg-hud-green/10 hover:text-hud-green text-hud-blue cursor-pointer transition-colors"
                                    title="Edit Profile"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {isAdmin && (
                                  <button
                                    onClick={() => triggerDelete(ath)}
                                    className="p-1.5 rounded-lg border border-hud-danger/20 hover:border-hud-danger hover:bg-hud-danger/15 text-hud-danger cursor-pointer transition-colors"
                                    title="Delete Profile"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        ))
                      ) : (
                        /* Empty state placeholder */
                        <tr>
                          <td colSpan={getTableColumns().length} className="p-8 text-center text-gray-500 font-sans">
                            <div className="max-w-md mx-auto space-y-2">
                              <AlertOctagon className="w-6 h-6 text-gray-500 mx-auto" />
                              <p className="text-xs">No athlete profiles match the current filter query.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-hud-border pt-4 text-xs text-gray-400">
                  <div>
                    Showing <span className="text-white font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-white font-semibold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-white font-semibold">{totalItems}</span> athletes
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                    >
                      Prev
                    </Button>
                    <span className="px-3 py-1.5 bg-hud-dark/50 border border-hud-border text-white rounded-lg font-semibold">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-hud-dark/30 border-t border-hud-border px-8 py-3 text-xs text-gray-500 flex justify-between items-center relative z-40">
        <div>
          <span>© 2026 KineticGuard. All rights reserved.</span>
        </div>
        <div className="flex gap-4">
          <span>Database Connected</span>
          <span>Synced Records: {totalItems}</span>
        </div>
      </footer>

      {/* MODAL 1: ADD / EDIT ATHLETE FORM */}
      <Modal
        isOpen={athleteModalOpen}
        onClose={() => setAthleteModalOpen(false)}
        title={selectedAthlete ? 'Edit Athlete Profile' : 'Create Athlete Profile'}
      >
        <form onSubmit={saveAthlete} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          
          {/* Photo capture upload section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-hud-dark/30 border border-hud-border">
            <div className="w-16 h-16 rounded-lg bg-hud-dark border border-hud-border overflow-hidden flex items-center justify-center flex-shrink-0 relative">
              {athleteForm.photo ? (
                <img 
                  src={`${BACKEND_URL}${athleteForm.photo}`} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User className="w-6 h-6 text-gray-500" />
              )}
              {photoUploading && (
                <div className="absolute inset-0 bg-hud-black/80 flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-hud-blue border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-semibold text-gray-400 block">Profile Photograph</span>
              <input 
                type="file" 
                accept="image/*" 
                id="photo-file" 
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={photoUploading}
              />
              <label 
                htmlFor="photo-file"
                className="px-3 py-1.5 text-xs font-medium rounded-lg btn-hud-secondary inline-block cursor-pointer disabled:opacity-50"
              >
                {photoUploading ? "Uploading..." : "Upload Photo"}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Athlete ID"
              placeholder="e.g. ATH-001"
              value={athleteForm.athlete_id}
              onChange={(e) => setAthleteForm({ ...athleteForm, athlete_id: e.target.value })}
              disabled={!!selectedAthlete}
            />
            <div className="sm:col-span-2">
              <Input
                label="Full Name"
                required
                placeholder="e.g. Marcus Thompson"
                value={athleteForm.full_name}
                onChange={(e) => setAthleteForm({ ...athleteForm, full_name: e.target.value })}
                disabled={user?.role === 'Athlete'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Age (Years)"
              type="number"
              required
              placeholder="e.g. 24"
              value={athleteForm.age}
              onChange={(e) => setAthleteForm({ ...athleteForm, age: e.target.value })}
            />
            <div>
              <label className="block text-[9px] font-hud-mono uppercase tracking-widest text-hud-blue mb-1.5">
                Gender
              </label>
              <select
                className="w-full px-3 py-2.5 bg-hud-dark border border-hud-border rounded-lg text-xs text-white"
                value={athleteForm.gender}
                onChange={(e) => setAthleteForm({ ...athleteForm, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-hud-mono uppercase tracking-widest text-hud-blue mb-1.5">
                Sport
              </label>
              <select
                className="w-full px-3 py-2.5 bg-hud-dark border border-hud-border rounded-lg text-xs text-white cursor-pointer"
                value={athleteForm.sport}
                onChange={(e) => setAthleteForm({ ...athleteForm, sport: e.target.value })}
              >
                <option value="Sprinting">Sprinting</option>
                <option value="Soccer">Soccer</option>
                <option value="Basketball">Basketball</option>
                <option value="Gymnastics">Gymnastics</option>
                <option value="Baseball">Baseball</option>
                <option value="Football">Football</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Playing Position"
              required
              placeholder="e.g. Forward"
              value={athleteForm.playing_position}
              onChange={(e) => setAthleteForm({ ...athleteForm, playing_position: e.target.value })}
            />
            <Input
              label="Height"
              required
              placeholder="e.g. 185 cm"
              value={athleteForm.height}
              onChange={(e) => setAthleteForm({ ...athleteForm, height: e.target.value })}
            />
            <Input
              label="Weight"
              required
              placeholder="e.g. 78 kg"
              value={athleteForm.weight}
              onChange={(e) => setAthleteForm({ ...athleteForm, weight: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[9px] font-hud-mono uppercase tracking-widest text-hud-blue mb-1.5">
                Training Load
              </label>
              <select
                className="w-full px-3 py-2.5 bg-hud-dark border border-hud-border rounded-lg text-xs text-white"
                value={athleteForm.training_load}
                onChange={(e) => setAthleteForm({ ...athleteForm, training_load: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <Input
                label="Experience"
                required
                placeholder="e.g. 3 years"
                value={athleteForm.experience}
                onChange={(e) => setAthleteForm({ ...athleteForm, experience: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[9px] font-hud-mono uppercase tracking-widest text-hud-blue mb-1.5">
                Fitness Level
              </label>
              <select
                className="w-full px-3 py-2.5 bg-hud-dark border border-hud-border rounded-lg text-xs text-white"
                value={athleteForm.fitness_level}
                onChange={(e) => setAthleteForm({ ...athleteForm, fitness_level: e.target.value })}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Elite">Elite</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <Input
                label="Coach Name"
                required
                placeholder="e.g. Coach Carter"
                value={athleteForm.coach_name}
                onChange={(e) => setAthleteForm({ ...athleteForm, coach_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-hud-mono uppercase tracking-widest text-hud-blue mb-1">
                Medical Notes
              </label>
              <textarea
                required
                className="w-full px-3 py-2.5 input-hud text-xs h-20 focus:outline-none focus:border-hud-blue"
                placeholder="e.g. Asthma managed with inhaler"
                value={athleteForm.medical_notes}
                onChange={(e) => setAthleteForm({ ...athleteForm, medical_notes: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[9px] font-hud-mono uppercase tracking-widest text-hud-blue mb-1">
                Injury History
              </label>
              <textarea
                required
                className="w-full px-3 py-2.5 input-hud text-xs h-20 focus:outline-none focus:border-hud-blue"
                placeholder="e.g. Sprained left ankle (April 2026)"
                value={athleteForm.injury_history}
                onChange={(e) => setAthleteForm({ ...athleteForm, injury_history: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Emergency Contact"
              required
              placeholder="e.g. Mary Thompson (555-1234)"
              value={athleteForm.emergency_contact}
              onChange={(e) => setAthleteForm({ ...athleteForm, emergency_contact: e.target.value })}
            />
            <div>
              <label className="block text-[9px] font-hud-mono uppercase tracking-widest text-hud-blue mb-1.5">
                Disability Status
              </label>
              <select
                className="w-full px-3 py-2.5 bg-hud-dark border border-hud-border rounded-lg text-xs text-white"
                value={athleteForm.disability_status}
                onChange={(e) => setAthleteForm({ ...athleteForm, disability_status: e.target.value })}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          {athleteForm.disability_status === 'Yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-hud-dark/40 border border-hud-border">
              <Input
                label="Disability Type"
                placeholder="e.g. Visually Impaired"
                value={athleteForm.disability_type}
                onChange={(e) => setAthleteForm({ ...athleteForm, disability_type: e.target.value })}
              />
              <Input
                label="Assistive Device"
                placeholder="e.g. Prosthetic Running Blade"
                value={athleteForm.assistive_device}
                onChange={(e) => setAthleteForm({ ...athleteForm, assistive_device: e.target.value })}
              />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-hud-border">
            <Button
              type="button"
              onClick={() => setAthleteModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button type="submit">
              Save Profile
            </Button>
          </div>

        </form>
      </Modal>

      {/* MODAL 2: VIEW ATHLETE DETAILS */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Athlete Profile Details"
      >
        {selectedAthlete && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 text-xs">
            
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-hud-dark/20 border border-hud-border">
              <div className="w-20 h-20 rounded-lg bg-hud-dark border border-hud-border overflow-hidden flex items-center justify-center flex-shrink-0">
                {selectedAthlete.photo ? (
                  <img 
                    src={`${BACKEND_URL}${selectedAthlete.photo}`} 
                    alt={selectedAthlete.full_name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-500" />
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h3 className="text-lg font-bold text-white uppercase">{selectedAthlete.full_name}</h3>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="px-2 py-0.5 rounded bg-hud-blue/15 border border-hud-blue/30 text-hud-blue font-semibold text-[10px]">
                    Sport: {selectedAthlete.sport}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-hud-green-glow border border-hud-green/30 text-hud-green font-semibold text-[10px]">
                    Level: {selectedAthlete.fitness_level}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-hud-dark/10 border border-hud-border">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block">Age / Gender</span>
                <span className="text-white font-semibold block">{selectedAthlete.age} yrs / {selectedAthlete.gender}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block">Height / Weight</span>
                <span className="text-white font-semibold block">{selectedAthlete.height} / {selectedAthlete.weight}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block">Position</span>
                <span className="text-white font-semibold block">{selectedAthlete.playing_position}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block">Training Load</span>
                <span className="text-hud-green font-semibold block">{selectedAthlete.training_load}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-lg bg-hud-dark/10 border border-hud-border">
                <span className="text-xs text-hud-blue uppercase font-bold tracking-wider block border-b border-hud-border pb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  Biographical Metrics
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Experience:</span>
                    <span className="text-white">{selectedAthlete.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coach:</span>
                    <span className="text-white">{selectedAthlete.coach_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Emergency Contact:</span>
                    <span className="text-white">{selectedAthlete.emergency_contact}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-hud-dark/10 border border-hud-border">
                <span className="text-xs text-hud-blue uppercase font-bold tracking-wider block border-b border-hud-border pb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Disability Status
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status flag:</span>
                    <span className="text-white font-semibold">{selectedAthlete.disability_status}</span>
                  </div>
                  {selectedAthlete.disability_status === 'Yes' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">{selectedAthlete.disability_type || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Device:</span>
                        <span className="text-white">{selectedAthlete.assistive_device || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 p-4 rounded-lg bg-hud-dark/15 border border-hud-danger/20">
                <span className="text-xs text-hud-danger uppercase font-bold tracking-wider block border-b border-hud-danger/20 pb-1 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  Injury History
                </span>
                <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{selectedAthlete.injury_history}</p>
              </div>

              <div className="space-y-1.5 p-4 rounded-lg bg-hud-dark/15 border border-hud-warning/20">
                <span className="text-xs text-hud-warning uppercase font-bold tracking-wider block border-b border-hud-warning/20 pb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Medical Notes
                </span>
                <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{selectedAthlete.medical_notes}</p>
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-500 border-t border-hud-border pt-4">
              <span>Created By: {selectedAthlete.created_by}</span>
              <span>Logged At: {new Date(selectedAthlete.created_at).toLocaleString()}</span>
            </div>

            <div className="flex justify-end pt-4 border-t border-hud-border mt-6">
              <Button onClick={() => setViewModalOpen(false)} variant="secondary">
                Close
              </Button>
            </div>

          </div>
        )}
      </Modal>

      {/* MODAL 3: DELETE CONFIRMATION */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="max-w-sm"
      >
        {selectedAthlete && (
          <div className="text-center font-sans">
            <AlertOctagon className="w-10 h-10 text-hud-danger mx-auto mb-4" />
            
            <h3 className="text-lg font-bold text-white mb-2">Delete Profile?</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Are you sure you want to permanently delete <span className="text-hud-danger font-semibold">{selectedAthlete.full_name}</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => setDeleteModalOpen(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={executeDelete} variant="danger" className="font-semibold">
                Delete Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* TOAST SYSTEM POPUP */}
      <Toast toast={toast} />

    </div>
  );
};

export default Dashboard;
