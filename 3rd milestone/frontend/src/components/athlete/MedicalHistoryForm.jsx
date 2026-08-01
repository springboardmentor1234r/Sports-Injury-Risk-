import React from 'react';

const MedicalHistoryForm = () => {
  return (
    <form className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Previous Injuries</label>
        <textarea className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-indigo-500 outline-none h-24" placeholder="List any previous injuries..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Current Conditions</label>
        <textarea className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-indigo-500 outline-none h-24" placeholder="Any ongoing medical conditions..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Surgeries</label>
        <textarea className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-indigo-500 outline-none h-24" placeholder="Details of any past surgeries..." />
      </div>
      <div className="flex justify-end space-x-3">
        <button type="button" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save Medical History</button>
      </div>
    </form>
  );
};

export default MedicalHistoryForm;
