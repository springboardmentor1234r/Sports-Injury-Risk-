import React, { useEffect, useState } from 'react';
import AthleteForm from '../components/AthleteForm';
import AthleteTable from '../components/AthleteTable';
import StatusBanner from '../components/StatusBanner';
import axiosInstance from '../services/axiosInstance';

const initialFormState = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  height: '',
  weight: '',
  sport: '',
  playingPosition: '',
  experienceYears: '',
  previousInjuryHistory: '',
  trainingLoad: '',
};

const mapAthleteToFormData = (athlete) => {
  const mapped = { ...initialFormState };

  Object.keys(initialFormState).forEach((key) => {
    const value = athlete?.[key];
    mapped[key] = value === undefined || value === null ? '' : String(value);
  });

  return mapped;
};

const buildPayload = (formData) => ({
  ...formData,
  height: Number(formData.height),
  weight: Number(formData.weight),
  experienceYears: Number(formData.experienceYears),
});

const Athletes = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState(initialFormState);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAthleteId, setEditingAthleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/athletes');
      setAthletes(response?.data?.data || []);
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to load athletes right now.';
      setStatus({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  const resetCreateForm = () => {
    setFormData(initialFormState);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAthleteId(null);
    setEditFormData(initialFormState);
  };

  const openEditModal = (athlete) => {
    setEditingAthleteId(athlete._id);
    setEditFormData(mapAthleteToFormData(athlete));
    setIsEditModalOpen(true);
    setStatus({ type: '', text: '' });
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', text: '' });
    setSubmitting(true);

    try {
      const payload = buildPayload(formData);
      const response = await axiosInstance.post('/athletes', payload);
      setStatus({ type: 'success', text: response?.data?.message || 'Athlete created successfully.' });
      resetCreateForm();
      await fetchAthletes();
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to create athlete profile.';
      setStatus({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', text: '' });
    setSubmitting(true);

    try {
      const payload = buildPayload(editFormData);
      const response = await axiosInstance.put(`/athletes/${editingAthleteId}`, payload);
      setStatus({ type: 'success', text: response?.data?.message || 'Athlete updated successfully.' });
      closeEditModal();
      await fetchAthletes();
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to update athlete profile.';
      setStatus({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (athlete) => {
    const confirmed = window.confirm('Are you sure you want to delete this athlete?');
    if (!confirmed) {
      return;
    }

    setStatus({ type: '', text: '' });
    setDeletingId(athlete._id);

    try {
      const response = await axiosInstance.delete(`/athletes/${athlete._id}`);
      setStatus({ type: 'success', text: response?.data?.message || 'Athlete deleted successfully.' });
      await fetchAthletes();
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to delete athlete profile.';
      setStatus({ type: 'error', text: message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Athlete Management</h2>
        <p className="text-sm text-slate-400">Create and review athlete profiles with your existing injury-risk workflow.</p>
      </div>

      <StatusBanner type={status.type} text={status.text} />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel rounded-2xl border border-slate-900 p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Add Athlete</h3>
            <p className="text-sm text-slate-400">Capture the core profile details needed for analysis.</p>
          </div>
          <AthleteForm formData={formData} onChange={setFormData} onSubmit={handleCreateSubmit} submitting={submitting} />
        </section>

        <section className="glass-panel rounded-2xl border border-slate-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Athlete Roster</h3>
              <p className="text-sm text-slate-400">A reusable view of all saved athlete profiles.</p>
            </div>
          </div>
          <AthleteTable athletes={athletes} loading={loading} onEdit={openEditModal} onDelete={handleDelete} deletingId={deletingId} />
        </section>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit Athlete</h3>
                <p className="text-sm text-slate-400">Update the selected athlete profile and save the latest details.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <AthleteForm formData={editFormData} onChange={setEditFormData} onSubmit={handleUpdateSubmit} submitting={submitting} isEditing />
          </div>
        </div>
      )}
    </div>
  );
};

export default Athletes;
