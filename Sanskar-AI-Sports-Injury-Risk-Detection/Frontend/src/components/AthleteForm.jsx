import React from 'react';

const inputClassName = 'w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

const AthleteForm = ({ formData, onChange, onSubmit, submitting, isEditing = false }) => {
  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    onChange((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
          <input name="fullName" value={formData.fullName} onChange={handleFieldChange} className={inputClassName} placeholder="e.g. Maya Chen" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Age</label>
          <input name="age" type="number" min="1" value={formData.age} onChange={handleFieldChange} className={inputClassName} placeholder="24" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Gender</label>
          <select name="gender" value={formData.gender} onChange={handleFieldChange} className={inputClassName} required>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Height (cm)</label>
          <input name="height" type="number" min="1" value={formData.height} onChange={handleFieldChange} className={inputClassName} placeholder="176" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Weight (kg)</label>
          <input name="weight" type="number" min="1" value={formData.weight} onChange={handleFieldChange} className={inputClassName} placeholder="68" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Sport</label>
          <input name="sport" value={formData.sport} onChange={handleFieldChange} className={inputClassName} placeholder="Basketball" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Playing Position</label>
          <input name="playingPosition" value={formData.playingPosition} onChange={handleFieldChange} className={inputClassName} placeholder="Guard" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Experience (Years)</label>
          <input name="experienceYears" type="number" min="0" value={formData.experienceYears} onChange={handleFieldChange} className={inputClassName} placeholder="5" required />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-300">Previous Injury History</label>
          <textarea name="previousInjuryHistory" value={formData.previousInjuryHistory} onChange={handleFieldChange} className={`${inputClassName} min-h-24 resize-y`} placeholder="Describe any relevant injury history" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Training Load</label>
          <select name="trainingLoad" value={formData.trainingLoad} onChange={handleFieldChange} className={inputClassName} required>
            <option value="">Select load</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : isEditing ? 'Update Athlete' : 'Add Athlete'}
        </button>
      </div>
    </form>
  );
};

export default AthleteForm;
