import React from 'react';
import { Mail, Send } from 'lucide-react';

const ForgotPasswordForm = () => {
  return (
    <form className="space-y-4 w-full">
      <div>
        <p className="text-gray-400 text-sm mb-4 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="email" 
            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>
      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors">
        <Send className="w-5 h-5 mr-2" /> Send Reset Link
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
