import React, { useState } from 'react';
import { Sun, Moon, Activity, ArrowRight, Play, Upload } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import './LandingPage.css';

export default function LandingPage({ theme, toggleTheme, user, login, logout }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('signin');

  const openAuth = (tab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const handleAuthSuccess = (authData) => {
    login(authData);
  };

  return (
    <div className="landing-container">
      {/* Header / Navigation Bar */}
      <header className="landing-header">
        <div className="landing-logo">
          <div className="logo-icon-wrapper">
            <Activity className="logo-icon" />
          </div>
          <span className="logo-text">SIRD</span>
        </div>

        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {user ? (
            <div className="header-user-nav">
              <a href="/dashboard" className="dashboard-link-btn">Go to Dashboard</a>
              <button className="logout-link-btn" onClick={logout}>Sign Out</button>
            </div>
          ) : (
            <>
              <button className="nav-signin" onClick={() => openAuth('signin')}>SIGN IN</button>
              <button className="nav-signup" onClick={() => openAuth('signup')}>SIGN UP</button>
            </>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="landing-hero animate-fade-in">
        <div className="badge-container">
          <span className="hero-badge">
            <span className="lightning-icon">⚡</span> NEXT-GEN INJURY RISK ANALYTICS
          </span>
        </div>

        <h1 className="hero-title">
          Detect Sports Injury Risks <br />
          <span className="accent-gradient">Before They Happen</span>
        </h1>

        <p className="hero-description">
          Upload video feeds of training sessions or game tape. Our computer vision models
          analyze movement biomechanics to flag high-risk motion patterns in real-time.
        </p>

        <div className="hero-ctas">
          <button className="cta-primary" onClick={() => openAuth('signup')}>
            <Upload size={18} />
            <span>Upload Video for Analysis</span>
          </button>
          <button className="cta-secondary" onClick={() => openAuth('signin')}>
            <Play size={18} />
            <span>View Live Demo</span>
          </button>
        </div>
      </main>

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialTab={modalTab}
      />
    </div>
  );
}
