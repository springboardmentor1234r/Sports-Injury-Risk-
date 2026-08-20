import React from 'react';

const AthleteForm = () => {
  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
          <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
          <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
          <input type="date" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Sport</label>
          <select className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-indigo-500 outline-none">
            <option>Basketball</option>
            <option>Soccer</option>
            <option>Tennis</option>
            <option>Track & Field</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Height (cm)</label>
          <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Weight (kg)</label>
          <input type="number" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-indigo-500 outline-none" />
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <button type="button" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save Athlete</button>
      </div>
    </form>
  );
};

export default AthleteForm;
