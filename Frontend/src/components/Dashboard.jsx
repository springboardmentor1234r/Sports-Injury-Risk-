import React from 'react';

function Dashboard({ onNavigate }) {
  return (
    <div className="card dashboard-card">
      <h2>Dashboard: Athlete Management</h2>
      <div className="athlete-details">
        <div>
          <h3 style={{ marginBottom: '5px' }}>Athlete ID: ATH-2026-001</h3>
          <p style={{ margin: '0', color: '#555' }}>Name: John Doe | Sport: Football | Age: 22</p>
          <p style={{ margin: '5px 0 0 0', color: '#555' }}>Injury History: Mild Right Knee Pain (2025)</p>
        </div>
        <div>
          <span className="badge">Status: Pending Assessment</span>
        </div>
      </div>
      <button className="btn success-btn" onClick={onNavigate}>
        Start Biomechanical Analysis &gt;&gt;
      </button>
    </div>
  );
}

export default Dashboard;