import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('/bg-pattern.svg')]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-500 mb-6">
          <Activity className="w-12 h-12" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white">Create an account</h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Sign in
          </a>
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white/5 backdrop-blur-xl py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-white/10">
          <RegisterForm />
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
