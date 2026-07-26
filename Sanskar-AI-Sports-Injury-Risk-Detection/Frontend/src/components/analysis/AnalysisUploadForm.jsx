import React, { useRef, useState } from 'react';

const ACCEPTED_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const AnalysisUploadForm = ({ onAnalyze, loading, athletes, athletesLoading }) => {
  const [file, setFile] = useState(null);
  const [athleteId, setAthleteId] = useState('');
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef(null);

  const selectFile = (selectedFile) => {
    if (!selectedFile) return;
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFile(null);
      setValidationError('Choose an MP4, MOV, AVI, or WEBM video.');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setValidationError('Video size must not exceed 100 MB.');
      return;
    }

    setFile(selectedFile);
    setValidationError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!athleteId || !file) {
      setValidationError('Choose an athlete and a video before starting the analysis.');
      return;
    }
    onAnalyze(file, athleteId);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Run AI Video Analysis</h3>
          <p className="mt-1 text-sm text-slate-400">Upload a training video to view its existing pose-analysis response.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input ref={inputRef} type="file" accept=".mp4,.mov,.avi,.webm" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} />
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-brand-500 hover:text-white">
            {file ? 'Change Video' : 'Choose Video'}
          </button>
          <button type="submit" disabled={loading} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Analyzing…' : 'Run Analysis'}
          </button>
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="analysis-athlete" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Athlete</label>
        <select id="analysis-athlete" value={athleteId} disabled={loading || athletesLoading} onChange={(event) => setAthleteId(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-500 disabled:opacity-60">
          <option value="">{athletesLoading ? 'Loading athletes…' : 'Select an athlete'}</option>
          {athletes.map((athlete) => <option key={athlete._id} value={athlete._id}>{athlete.fullName}</option>)}
        </select>
      </div>
      {(file || validationError) && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${validationError ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-slate-800 bg-slate-950/60 text-slate-300'}`}>
          {validationError || `Selected video: ${file.name}`}
        </div>
      )}
    </form>
  );
};

export default AnalysisUploadForm;
