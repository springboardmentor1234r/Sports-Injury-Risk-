import React from 'react';

function Login({ onLogin }) {
  return (
    <div className="card login-card">
      <h3>System Login</h3>
      <p style={{ color: '#666', fontSize: '14px' }}>Authenticate to access the platform</p>
      <input type="text" placeholder="Username (e.g., admin)" defaultValue="coach_admin" />
      <input type="password" placeholder="Password" defaultValue="password123" />
      <select>
        <option value="Coach">Coach</option>
        <option value="Physiotherapist">Physiotherapist</option>
      </select>
      <button className="btn primary-btn" onClick={onLogin}>Login</button>
    </div>
  );
}

export default Login;