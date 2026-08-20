import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Lock, Shield } from 'lucide-react';

const Settings = ({ user }) => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalRiskOnly, setCriticalRiskOnly] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg('Settings saved successfully.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">System & Security Settings</h1>
        <p className="page-subtitle">Configure notification preferences, security keys, and video analysis parameters.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        {savedMsg && <div style={{ padding: '0.75rem', backgroundColor: '#DCFCE7', color: '#15803D', borderRadius: '8px', marginBottom: '1rem', fontWeight: '700' }}>{savedMsg}</div>}

        <form onSubmit={handleSave}>
          <h3 className="card-title">Notification Preferences</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
              <span>Send instant email alerts when high injury risk (&gt; 50/100) is detected</span>
            </label>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={criticalRiskOnly} onChange={(e) => setCriticalRiskOnly(e.target.checked)} />
              <span>Receive critical notifications only</span>
            </label>
          </div>

          <h3 className="card-title">Analysis Engine Defaults</h3>
          <div className="form-group">
            <label className="form-label">Pose Estimation Engine Model Complexity</label>
            <select className="form-select" defaultValue="1">
              <option value="1">Model Complexity 1 (Balanced Real-Time Speed & Accuracy)</option>
              <option value="2">Model Complexity 2 (High Precision Multi-Pass)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Save Preference Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
