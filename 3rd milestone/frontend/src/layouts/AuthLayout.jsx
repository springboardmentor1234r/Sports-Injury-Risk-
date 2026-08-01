import React from 'react';
import { Outlet } from 'react-router-dom';
import { Activity } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('/bg-pattern.svg')]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Activity className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-3xl font-extrabold text-white">SportRisk AI</h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 backdrop-blur-xl py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-white/10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
