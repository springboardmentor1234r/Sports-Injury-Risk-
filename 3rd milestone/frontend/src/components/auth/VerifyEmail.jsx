import React from 'react';
import { CheckCircle } from 'lucide-react';

const VerifyEmail = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
      <p className="text-gray-400 mb-6">
        Thank you for verifying your email address. Your account is now fully active.
      </p>
      <a href="/login" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
        Proceed to Login
      </a>
    </div>
  );
};

export default VerifyEmail;
