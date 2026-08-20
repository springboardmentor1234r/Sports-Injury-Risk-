/**
 * ProfileSettingsTab.jsx
 * Athlete → "Profile Settings" tab
 * Also renders the initial Questionnaire when the athlete has no profile yet.
 */
import React from 'react';

export default function ProfileSettingsTab({
  isQuestionnaire, // true = new athlete setup, false = edit existing
  sportType, setSportType,
  position, setPosition,
  age, setAge,
  height, setHeight,
  weight, setWeight,
  trainingLoad, setTrainingLoad,
  injuryHistory, setInjuryHistory,
  assignedCoach, setAssignedCoach,
  assignedPhysio, setAssignedPhysio,
  coachesList, physiosList,
  submitting, errorMsg,
  onSubmit,
}) {
  const title = isQuestionnaire ? 'Athlete Physical Questionnaire' : 'Profile Settings';
  const desc = isQuestionnaire
    ? 'Welcome to SIRD! Please complete your physical credentials to unlock your injury analytics dashboard.'
    : 'Edit and update your physical and practitioner parameters below.';
  const btnText = isQuestionnaire
    ? (submitting ? 'Submitting Details...' : 'Save Profile & Open Dashboard')
    : (submitting ? 'Saving Metrics...' : 'Update Profile Details');

  return (
    <div className={`content-hero-card animate-fade-in ${isQuestionnaire ? 'questionnaire-card' : ''}`}>
      <div className="hero-accent-strip" />
      <div className="form-header">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>

      {errorMsg && (
        <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className={isQuestionnaire ? 'questionnaire-form' : 'settings-form'}>
        <div className="form-grid">
          <div className="form-group">
            <label>Sport Type {isQuestionnaire && '*'}</label>
            <input type="text" placeholder="e.g. Soccer, Basketball" value={sportType}
              onChange={(e) => setSportType(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Playing Position {isQuestionnaire && '*'}</label>
            <input type="text" placeholder="e.g. Forward, Point Guard" value={position}
              onChange={(e) => setPosition(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Age (years) {isQuestionnaire && '*'}</label>
            <input type="number" placeholder="e.g. 23" value={age}
              onChange={(e) => setAge(e.target.value)} required min="1" />
          </div>
          <div className="form-group">
            <label>Height (cm) {isQuestionnaire && '*'}</label>
            <input type="number" step="0.1" placeholder="e.g. 182.5" value={height}
              onChange={(e) => setHeight(e.target.value)} required min="10" />
          </div>
          <div className="form-group">
            <label>Weight (kg) {isQuestionnaire && '*'}</label>
            <input type="number" step="0.1" placeholder="e.g. 78.2" value={weight}
              onChange={(e) => setWeight(e.target.value)} required min="10" />
          </div>
          <div className="form-group">
            <label>Weekly Training Load {isQuestionnaire && '*'}</label>
            <input type="text" placeholder="e.g. 12 hours/week, High intensity" value={trainingLoad}
              onChange={(e) => setTrainingLoad(e.target.value)} required />
          </div>

          {/* Coach dropdown */}
          <div className="form-group">
            <label>Assign Coach</label>
            <select value={assignedCoach} onChange={(e) => setAssignedCoach(e.target.value)} className="form-select">
              <option value="">-- No Coach Selected --</option>
              {coachesList.map((c) => (
                <option key={c.email} value={c.fullname}>{c.fullname}</option>
              ))}
            </select>
          </div>

          {/* Physio dropdown */}
          <div className="form-group">
            <label>Assign Physiotherapist</label>
            <select value={assignedPhysio} onChange={(e) => setAssignedPhysio(e.target.value)} className="form-select">
              <option value="">-- No Physiotherapist Selected --</option>
              {physiosList.map((p) => (
                <option key={p.email} value={p.fullname}>{p.fullname}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group full-width">
          <label>Injury History Log {isQuestionnaire && '*'}</label>
          <textarea
            rows="3"
            placeholder="Provide details of any past operations, sprains, or recurring issues (e.g. ACL tear in 2024)"
            value={injuryHistory}
            onChange={(e) => setInjuryHistory(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="form-submit-btn" disabled={submitting}>
          {btnText}
        </button>
      </form>
    </div>
  );
}
