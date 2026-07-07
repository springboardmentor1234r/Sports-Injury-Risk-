import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
    const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'athlete' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', form);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '2rem', maxWidth: 300 }}>
            <h2>Register</h2>
            <input name="full_name" placeholder="Full Name" onChange={handleChange} /><br /><br />
            <input name="email" placeholder="Email" onChange={handleChange} /><br /><br />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} /><br /><br />
            <select name="role" onChange={handleChange}>
                <option value="athlete">Athlete</option>
                <option value="coach">Coach</option>
                <option value="physiotherapist">Physiotherapist</option>
                <option value="sports_scientist">Sports Scientist</option>
                <option value="admin">Admin</option>
            </select><br /><br />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">Register</button>
        </form>
    );
}