import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sird_theme') || 'light';
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('sird_token') || null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sird_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sird_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const login = (authData) => {
    setToken(authData.access_token);
    const userProfile = {
      fullname: authData.fullname,
      email: authData.email,
      role: authData.role
    };
    setUser(userProfile);
    localStorage.setItem('sird_token', authData.access_token);
    localStorage.setItem('sird_user', JSON.stringify(userProfile));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sird_token');
    localStorage.removeItem('sird_user');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <LandingPage 
              theme={theme} 
              toggleTheme={toggleTheme} 
              user={user} 
              login={login} 
              logout={logout} 
            />
          } 
        />
        
        <Route 
          path="/auth/callback" 
          element={
            <AuthCallback login={login} />
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            user ? (
              <Dashboard 
                user={user} 
                token={token} 
                logout={logout} 
                theme={theme} 
                toggleTheme={toggleTheme} 
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
