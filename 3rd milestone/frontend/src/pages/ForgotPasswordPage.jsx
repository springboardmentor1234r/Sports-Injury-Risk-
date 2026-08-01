import React from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-white">Reset Password</h2>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-xl py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-white/10">
          <ForgotPasswordForm />
          <div className="mt-4 text-center">
            <a href="/login" className="text-sm text-indigo-400 hover:text-indigo-300">Back to Login</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
