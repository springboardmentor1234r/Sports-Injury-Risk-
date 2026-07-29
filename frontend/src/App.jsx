import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  return (
    <div className="app-container">
      <header className="header">
        <h2>🏋️‍♂️ Sports Injury Risk Detection</h2>
        {currentPage !== 'login' && (
          <div className="user-info">
            Welcome, <strong>coach_admin</strong> | 
            <button className="link-btn" onClick={() => setCurrentPage('login')}>Logout</button>
          </div>
        )}
      </header>

      <main className="main-content">
        {currentPage === 'login' && <Login onLogin={() => setCurrentPage('dashboard')} />}
        {currentPage === 'dashboard' && <Dashboard onNavigate={() => setCurrentPage('analysis')} />}
        {currentPage === 'analysis' && <Analysis onBack={() => setCurrentPage('dashboard')} />}
      </main>
    </div>
  );
}

export default App;