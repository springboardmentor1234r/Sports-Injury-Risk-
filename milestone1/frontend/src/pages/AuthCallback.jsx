import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import './AuthCallback.css';

export default function AuthCallback({ login }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');
    const fullname = params.get('fullname');
    const email = params.get('email');
    const err = params.get('error');

    if (err) {
      setError(decodeURIComponent(err));
      setTimeout(() => navigate('/'), 4000);
      return;
    }

    if (token && role && fullname && email) {
      // Successful Google Auth
      const authData = {
        access_token: token,
        token_type: 'bearer',
        role: decodeURIComponent(role),
        fullname: decodeURIComponent(fullname),
        email: decodeURIComponent(email),
      };
      
      login(authData);
      navigate('/dashboard');
    } else {
      setError('Invalid authorization callback data.');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [location, login, navigate]);

  return (
    <div className="callback-container">
      <div className="callback-card animate-scale-in">
        {error ? (
          <div className="callback-error-content">
            <ShieldAlert size={48} className="error-icon" />
            <h2>Authentication Failed</h2>
            <p className="error-msg">{error}</p>
            <p className="redirect-text">Redirecting you to the home page...</p>
          </div>
        ) : (
          <div className="callback-loading-content">
            <Loader2 size={48} className="spinner" />
            <h2>Completing Sign In</h2>
            <p>Syncing your profile credentials, please wait...</p>
          </div>
        )}
      </div>
    </div>
  );
}
