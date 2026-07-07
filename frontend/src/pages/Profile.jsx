import { useState, useEffect } from 'react';
import api from '../api';

export default function Profile() {
    const [form, setForm] = useState({
        sport_type: '', position: '', age: '', height_cm: '', weight_kg: '',
        injury_history: '', training_load: '',
    });
    const [exists, setExists] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        api.get('/athletes/me')
            .then(res => {
                setForm(res.data);
                setExists(true);
            })
            .catch(() => setExists(false)); // 404 = no profile yet, that's fine
    }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (exists) {
                await api.put('/athletes/me', form);
                setMessage('Profile updated!');
            } else {
                await api.post('/athletes/me', form);
                setMessage('Profile created!');
                setExists(true);
            }
        } catch (err) {
            setMessage(err.response?.data?.detail || 'Something went wrong');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: 400 }}>
            <h2>Athlete Profile</h2>
            <form onSubmit={handleSubmit}>
                <input name="sport_type" placeholder="Sport Type" value={form.sport_type || ''} onChange={handleChange} /><br /><br />
                <input name="position" placeholder="Position" value={form.position || ''} onChange={handleChange} /><br /><br />
                <input name="age" type="number" placeholder="Age" value={form.age || ''} onChange={handleChange} /><br /><br />
                <input name="height_cm" type="number" placeholder="Height (cm)" value={form.height_cm || ''} onChange={handleChange} /><br /><br />
                <input name="weight_kg" type="number" placeholder="Weight (kg)" value={form.weight_kg || ''} onChange={handleChange} /><br /><br />
                <textarea name="injury_history" placeholder="Injury History" value={form.injury_history || ''} onChange={handleChange} /><br /><br />
                <select name="training_load" value={form.training_load || ''} onChange={handleChange}>
                    <option value="">Training Load</option>
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                </select><br /><br />
                <button type="submit">{exists ? 'Update Profile' : 'Create Profile'}</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}