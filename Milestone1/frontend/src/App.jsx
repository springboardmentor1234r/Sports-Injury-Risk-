import React, { useState } from 'react';

import {
  AuthProvider,
  useAuth
} from './context/AuthContext';

import { Navbar } from './components/common/Navbar';

import { LoginPage } from './components/auth/LoginPage';
import { RegisterModal } from './components/auth/RegisterModal';

import { AthleteDashboard } from './components/dashboards/AthleteDashboard';
import { CoachDashboard } from './components/dashboards/CoachDashboard';
import { PhysiotherapistDashboard } from './components/dashboards/PhysiotherapistDashboard';
import { SportsScientistDashboard } from './components/dashboards/SportsScientistDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';


const MainContent = () => {

  const {
    user,
    loading
  } = useAuth();

  const [
    isRegisterOpen,
    setIsRegisterOpen
  ] = useState(false);


  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center font-sans">

        <div className="text-slate-400 text-lg">
          Loading...
        </div>

      </div>
    );
  }


  // --------------------------------------------------
  // LOGIN PAGE
  // --------------------------------------------------
  // If there is NO logged-in user,
  // show only the Login page.
  // --------------------------------------------------
  if (!user) {

    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans">

        <LoginPage
          onOpenRegister={() =>
            setIsRegisterOpen(true)
          }
        />

        <RegisterModal
          isOpen={isRegisterOpen}

          onClose={() =>
            setIsRegisterOpen(false)
          }

          onSwitchToLogin={() =>
            setIsRegisterOpen(false)
          }
        />

      </div>
    );
  }


  // --------------------------------------------------
  // DASHBOARD BASED ON USER ROLE
  // --------------------------------------------------
  const renderDashboardByRole = () => {

    switch (user.role) {

      case 'Athlete':
        return <AthleteDashboard />;

      case 'Coach':
        return <CoachDashboard />;

      case 'Physiotherapist':
        return <PhysiotherapistDashboard />;

      case 'Sports Scientist':
        return <SportsScientistDashboard />;

      case 'Administrator':
        return <AdminDashboard />;

      default:
        return <AthleteDashboard />;
    }
  };


  // --------------------------------------------------
  // LOGGED-IN DASHBOARD
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">

      {/* Navbar */}
      <Navbar
        onOpenAuth={() =>
          setIsRegisterOpen(true)
        }
      />


      {/* Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {renderDashboardByRole()}

      </main>


      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">

        <p>
          © 2026 Kinematix AI • Sports Injury Risk Detection Platform from Video • Milestone 1 Architecture
        </p>

      </footer>


      {/* Register Modal */}
      <RegisterModal

        isOpen={isRegisterOpen}

        onClose={() =>
          setIsRegisterOpen(false)
        }

        onSwitchToLogin={() =>
          setIsRegisterOpen(false)
        }

      />

    </div>
  );
};


// --------------------------------------------------
// APP
// --------------------------------------------------
export default function App() {

  return (
    <AuthProvider>

      <MainContent />

    </AuthProvider>
  );
}