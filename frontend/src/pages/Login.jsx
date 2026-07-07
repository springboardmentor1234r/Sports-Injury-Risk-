import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const form = new URLSearchParams();
            form.append('username', email);   // FastAPI's OAuth2 form expects "username"
            form.append('password', password);

            const res = await api.post('/auth/login', form, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            localStorage.setItem('token', res.data.access_token);
            navigate('/profile');
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '2rem', maxWidth: 300 }}>
            <h2>Login</h2>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br /><br />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br /><br />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">Login</button>
        </form>
    );
}