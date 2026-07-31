import React, { useRef, useState } from 'react';

const ACCEPTED_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DURATION_SEC = 10;

const formatMB = (bytes) => (bytes / (1024 * 1024)).toFixed(1);

const getVideoDuration = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
    video.src = URL.createObjectURL(file);
  });
};

const AnalysisUploadForm = ({ onAnalyze, loading, athletes, athletesLoading }) => {
  const [file, setFile] = useState(null);
  const [athleteId, setAthleteId] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef(null);

  const selectFile = async (selectedFile) => {
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFile(null);
      setValidationError('Choose an MP4, MOV, AVI, or WEBM video.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    // 1. Validate File Size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setValidationError(`Selected Video: ${formatMB(selectedFile.size)} MB — Maximum allowed: ${formatMB(MAX_FILE_SIZE)} MB.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    // 2. Validate Video Duration
    setIsValidating(true);
    setValidationError('');
    const duration = await getVideoDuration(selectedFile);
    setIsValidating(false);

    if (duration === null) {
      setFile(null);
      setValidationError('Could not read video duration. Please try a different file.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (duration > MAX_DURATION_SEC) {
      setFile(null);
      setValidationError(`Video Duration: ${duration.toFixed(1)} sec — Maximum allowed: ${MAX_DURATION_SEC} sec.`);
      if (inputRef.current) inputRef.current.value = '';
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

  const analyzeDisabled = loading || isValidating || !file;

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Run AI Video Analysis</h3>
          <p className="mt-1 text-sm text-slate-500">Upload a training video to view its existing pose-analysis response.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input ref={inputRef} type="file" accept=".mp4,.mov,.avi,.webm" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={isValidating} className="rounded-xl border border-brand-500 bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isValidating ? 'Validating…' : file ? 'Change Video' : 'Choose Video'}
          </button>
          <button type="submit" disabled={analyzeDisabled} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60">
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
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500">
        <span><strong>Supported formats:</strong> MP4, MOV, AVI, WEBM</span>
        <span><strong>Maximum size:</strong> 10 MB</span>
        <span><strong>Maximum duration:</strong> 10 seconds</span>
      </div>
      {(file || validationError || isValidating) && (
        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${validationError ? 'border-red-200 bg-red-50 text-red-700' : isValidating ? 'border-yellow-200 bg-yellow-50 text-yellow-700' : 'border-brand-200 bg-brand-50 text-slate-600'}`}>
          {validationError || (isValidating ? 'Validating video…' : `Selected video: ${file.name}`)}
        </div>
      )}
    </form>
  );
};

export default AnalysisUploadForm;
