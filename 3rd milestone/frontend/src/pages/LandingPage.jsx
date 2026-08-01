import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, BarChart } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Activity className="text-indigo-500 w-8 h-8" />
          <span>SportRisk AI</span>
        </div>
        <div className="space-x-4">
          <a href="/login" className="text-gray-300 hover:text-white transition-colors">Login</a>
          <a href="/register" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-full font-medium transition-colors">Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
          >
            Predict Injuries Before <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">They Happen</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Advanced biomechanical analysis using computer vision to detect injury risks in athletes. Upload video, get instant insights.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-4"
          >
            <a href="/register" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-lg rounded-full font-semibold transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              Start Free Trial
            </a>
            <a href="#how-it-works" className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-lg rounded-full font-semibold transition-all">
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-900 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why SportRisk AI?</h2>
            <p className="text-gray-400">Empowering coaches and physios with data-driven insights.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Analysis</h3>
              <p className="text-gray-400">Process videos in seconds. Get biomechanical metrics without expensive lab equipment.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Preventive Care</h3>
              <p className="text-gray-400">Identify faulty movement patterns like valgus collapse before they lead to serious injury.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center mb-6">
                <BarChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Track Progress</h3>
              <p className="text-gray-400">Monitor rehabilitation progress over time with objective data and visual comparisons.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
