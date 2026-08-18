import React from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { authService } from '../services/authService';
import { useEffect } from 'react';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const clearSavedCredentials = () => {
    localStorage.removeItem('savedCredentials');
    localStorage.removeItem('user');
  };

  // Prefill from the latest saved credentials if available
  const saved = JSON.parse(localStorage.getItem('savedCredentials') || 'null');
  const [email, setEmail] = useState(saved?.email || '');
  const [password, setPassword] = useState(saved?.password || '');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');

  useEffect(() => {
    const saved2 = JSON.parse(localStorage.getItem('savedCredentials') || 'null');
    if (saved2) {
      setEmail(saved2.email || '');
      setPassword(saved2.password || '');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.login({ email, password });
      const user = res.user || res;
      localStorage.setItem('user', JSON.stringify(user));
      dispatch(loginSuccess(user));
      navigate('/');
    } catch (err) {
      console.error('Login failed', err);
      alert('Login failed: ' + (err?.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-danger/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card glass className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              SportsRisk
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
            <div className="mt-2 flex justify-end items-center">
              <button type="button" onClick={() => setShowAddUser(true)} className="text-sm text-emerald-400 hover:underline">Add User</button>
            </div>
          </form>

          {showAddUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Add New User</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const payload = {
                      email: newEmail,
                      password: newPassword,
                      full_name: newFullName || newEmail.split('@')[0],
                      role: 'ATHLETE'
                    };
                    await authService.register(payload);
                    clearSavedCredentials();
                    localStorage.setItem('savedCredentials', JSON.stringify({ email: newEmail, password: newPassword }));
                    setEmail(newEmail);
                    setPassword(newPassword);
                    setShowAddUser(false);
                    setNewEmail(''); setNewPassword(''); setNewFullName('');
                    alert('User created and saved for the next login.');
                  } catch (err) {
                    console.error('Add user failed', err);
                    alert('Failed to create user: ' + (err?.response?.data?.detail || err.message));
                  }
                }} className="space-y-3">
                  <input value={newFullName} onChange={(e)=>setNewFullName(e.target.value)} placeholder="Full name (optional)" className="w-full p-2 border rounded" />
                  <input required value={newEmail} onChange={(e)=>setNewEmail(e.target.value)} type="email" placeholder="Email" className="w-full p-2 border rounded" />
                  <input required value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} type="password" placeholder="Password" className="w-full p-2 border rounded" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddUser(false)} className="px-3 py-1 rounded border">Cancel</button>
                    <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
