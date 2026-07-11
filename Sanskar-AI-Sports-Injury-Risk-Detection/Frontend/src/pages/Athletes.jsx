import React, { useEffect, useState } from 'react';
import AthleteForm from '../components/AthleteForm';
import AthleteTable from '../components/AthleteTable';
import StatusBanner from '../components/StatusBanner';
import axiosInstance from '../services/axiosInstance';

const initialFormState = {
  fullName: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  sport: '',
  playingPosition: '',
  experienceYears: '',
  previousInjuryHistory: '',
  trainingLoad: '',
};

const Athletes = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [status, setStatus] = useState({ type: '', text: '' });

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', text: '' });
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
        experienceYears: Number(formData.experienceYears),
      };

      const response = await axiosInstance.post('/athletes', payload);
      setStatus({ type: 'success', text: response?.data?.message || 'Athlete created successfully.' });
      setFormData(initialFormState);
      await fetchAthletes();
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to create athlete profile.';
      setStatus({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
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
          <AthleteForm formData={formData} onChange={setFormData} onSubmit={handleSubmit} submitting={submitting} />
        </section>

        <section className="glass-panel rounded-2xl border border-slate-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Athlete Roster</h3>
              <p className="text-sm text-slate-400">A reusable view of all saved athlete profiles.</p>
            </div>
          </div>
          <AthleteTable athletes={athletes} loading={loading} />
        </section>
      </div>
    </div>
  );
};

export default Athletes;
