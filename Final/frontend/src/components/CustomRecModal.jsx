import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import './CustomRecModal.css';

export default function CustomRecModal({ isOpen, onClose, athleteId, athleteName, token, onRecAdded }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Exercise Recommendation');
  const [exerciseType, setExerciseType] = useState('Corrective');
  const [priority, setPriority] = useState('High');
  const [bodyRegion, setBodyRegion] = useState('Lower Limb');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('15 mins');
  const [frequency, setFrequency] = useState('3x / week');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${apiBase}/api/recommendations/custom`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          athlete_id: athleteId,
          title,
          category,
          exercise_type: exerciseType,
          priority,
          body_region: bodyRegion,
          description,
          duration,
          frequency
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to submit recommendation.");
      }

      if (onRecAdded) onRecAdded(data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="custom-rec-modal-overlay">
      <div className="custom-rec-modal-card animate-scale-in">
        <div className="modal-header">
          <div>
            <h3>Prescribe Custom Recommendation</h3>
            <p className="modal-subtitle">For Athlete: <strong>{athleteName} ({athleteId})</strong></p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {errorMsg && <div className="modal-error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="custom-rec-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="e.g. Single-Leg Eccentric Squat Protocol"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Exercise Recommendation">Exercise Recommendation</option>
                <option value="Mobility Suggestion">Mobility Suggestion</option>
                <option value="Strengthening Recommendation">Strengthening Recommendation</option>
                <option value="Recovery Planning">Recovery Planning</option>
                <option value="Training Modification">Training Modification</option>
              </select>
            </div>

            <div className="form-group">
              <label>Exercise Type</label>
              <select value={exerciseType} onChange={(e) => setExerciseType(e.target.value)}>
                <option value="Corrective">Corrective</option>
                <option value="Mobility">Mobility</option>
                <option value="Strength">Strength</option>
                <option value="Recovery">Recovery</option>
                <option value="Training Mod">Training Mod</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label>Target Body Region</label>
              <input
                type="text"
                placeholder="e.g. Knee, Hamstring, Core"
                value={bodyRegion}
                onChange={(e) => setBodyRegion(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration / Frequency</label>
              <input
                type="text"
                placeholder="e.g. 15 mins / 3x week"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Prescription & Instructions *</label>
            <textarea
              rows="3"
              placeholder="Provide specific instructions, rep counts, rest intervals, and movement cues for the athlete."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              <PlusCircle size={16} />
              <span>{submitting ? 'Prescribing...' : 'Prescribe to Athlete'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
