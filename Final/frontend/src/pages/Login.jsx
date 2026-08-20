import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Activity, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/Button';
import Input from '../components/Input';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', {
        email: formData.email,
        password: formData.password,
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Authentication failed. Check credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-hud-black text-white relative flex flex-col font-sans">
      
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg border border-hud-border hover:border-hud-blue hover:text-hud-blue cursor-pointer transition-colors text-gray-400 bg-hud-dark/50"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-hud-warning" /> : <Moon className="w-4 h-4 text-hud-blue" />}
        </button>
      </div>

      {/* LEFT COLUMN: Auth Form */}
      <div className="lg:col-span-5 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-12 relative z-20 bg-hud-black border-r border-hud-border">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded bg-hud-blue flex items-center justify-center shadow-md">
            <Activity className="w-4.5 h-4.5 text-white stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-wider text-white uppercase block">
              KINETIC<span className="text-hud-green">GUARD</span>
            </span>
            <span className="text-[9px] text-hud-blue uppercase block font-semibold">
              {/*Athletic Risk Diagnostics*/}
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight uppercase mb-2">
            Operator Access
          </h2>
          <p className="text-gray-400 text-sm">
            Sign in using your account credentials.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-lg bg-hud-danger/10 border border-hud-danger/30 text-hud-danger text-xs flex items-start gap-2.5"
          >
            <Shield className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Authentication Error</p>
              <p className="opacity-90 mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            name="email"
            label="Email Address"
            type="email"
            required
            icon={Mail}
            placeholder="operator@kineticguard.io"
            value={formData.email}
            onChange={handleChange}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-11 py-2.5 input-hud text-xs placeholder-gray-600 focus:ring-1 focus:ring-hud-blue/30"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-hud-blue/40 hover:text-hud-blue transition-colors cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full py-3 rounded-lg font-bold text-xs"
          >
            Sign In to Account
          </Button>
        </form>

        {/* Footer info link */}
        <div className="mt-10 text-center text-xs text-gray-500 font-hud-mono">
         {/* Need database clearance?{' '} */}
          <Link to="/register" className="text-hud-blue hover:text-hud-green font-bold transition-colors">
            Register Operator
          </Link>
        </div>
      </div>

      {/* RIGHT COLUMN: Professional Clean Design Overlay */}
      <div className="lg:col-span-7 hidden lg:block relative bg-hud-dark overflow-hidden">
        {/* Smooth dark frosted overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-hud-black/90 via-hud-black/45 to-transparent z-10"></div>

        {/* Information overlay (SaaS Style) */}
        <div className="absolute inset-0 flex flex-col justify-end p-16 z-20 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-4"
          >
            <span className="px-3 py-1 rounded-full bg-hud-blue/15 text-hud-blue border border-hud-blue/30 text-[10px] uppercase font-bold tracking-widest inline-block">
             Sport
             {/* SaaS Biomechanics Platform */}
            </span>
            <h2 className="text-3xl font-extrabold tracking-wide uppercase leading-tight">
              {/*Empowering peak performance with precision telemetry*/}
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {/*Track biometrics, monitor training recovery load, and optimize athletic workflows in one secure, unified database dashboard.*/}
            </p>
          </motion.div>
        </div>

        {/* Cinematic Athlete Image */}
        <img 
          src="/athlete_sprinting.png" 
          alt="Athlete Sprinting" 
          className="w-full h-full object-cover object-center absolute inset-0 z-5 select-none"
        />
      </div>

    </div>
  );
};

export default Login;
