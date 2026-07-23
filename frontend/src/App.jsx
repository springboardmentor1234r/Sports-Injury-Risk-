import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { Activity } from 'lucide-react';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const VideoUpload = lazy(() => import('./milestone2/pages/VideoUpload'));
const PoseAnalysis = lazy(() => import('./milestone2/pages/PoseAnalysis'));
const SkeletonTracking = lazy(() => import('./milestone2/pages/SkeletonTracking'));
const Biomechanics = lazy(() => import('./milestone2/pages/Biomechanics'));

const ComponentLoader = () => (
  <div className="min-h-screen bg-hud-black flex items-center justify-center font-sans relative hud-scanline">
    <div className="flex flex-col items-center gap-4">
      <Activity className="animate-spin h-10 w-10 text-hud-blue" />
      <span className="text-hud-blue font-hud-mono tracking-widest text-xs animate-pulse">BOOTING SCANNER...</span>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<ComponentLoader />}>
        <Routes>
          {/* Default route redirecting to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Dashboard Route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Video Upload Route */}
          <Route 
            path="/milestone2/upload" 
            element={
              <ProtectedRoute>
                <VideoUpload />
              </ProtectedRoute>
            } 
          />

          {/* Protected Pose Analysis Route */}
          <Route 
            path="/milestone2/pose" 
            element={
              <ProtectedRoute>
                <PoseAnalysis />
              </ProtectedRoute>
            } 
          />

          {/* Protected Skeleton Tracking Route */}
          <Route 
            path="/milestone2/skeleton" 
            element={
              <ProtectedRoute>
                <SkeletonTracking />
              </ProtectedRoute>
            } 
          />

          {/* Protected Biomechanics Route */}
          <Route 
            path="/milestone2/biomechanics" 
            element={
              <ProtectedRoute>
                <Biomechanics />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback for any unknown route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
