import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import { authService } from '../../services/authService';
import { loginSuccess } from '../../store/slices/authSlice';

const RegisterForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ATHLETE');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = { full_name: fullName, email, password, role };
      // Register user
      await authService.register(userData);
      // Auto-login to get user (server sets HttpOnly session cookie)
      const loginRes = await authService.login({ email, password });
      const user = loginRes.user || loginRes;
      // Save only email for prefill (do not store plaintext passwords)
      localStorage.setItem('savedCredentials', JSON.stringify({ email }));
      localStorage.setItem('user', JSON.stringify(user));
      dispatch(loginSuccess(user));
      navigate('/');
    } catch (err) {
      console.error('Registration failed', err);
      alert('Registration failed: ' + (err?.response?.data?.detail || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="text" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            placeholder="John Doe"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
        <select value={role} onChange={(e)=>setRole(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
          <option value="ATHLETE">Athlete</option>
          <option value="COACH">Coach</option>
          <option value="PHYSIOTHERAPIST">Physiotherapist</option>
          <option value="SPORTS_SCIENTIST">Sport Scientist</option>
          <option value="ADMINISTRATOR">Administrator</option>
        </select>
      </div>
      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors mt-2">
        <UserPlus className="w-5 h-5 mr-2" /> Create Account
      </button>
    </form>
  );
};

export default RegisterForm;
