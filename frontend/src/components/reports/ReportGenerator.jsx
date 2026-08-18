import React, { useEffect, useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { FileText, Download, Share2 } from 'lucide-react';

const REPORT_STORAGE_KEY = 'generatedReports';

export default function ReportGenerator() {
  const [athletes, setAthletes] = useState(['Alex Johnson', 'Mike Williams', 'Sarah Smith']);
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [selectedRange, setSelectedRange] = useState('Last 30 Days');
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const updateVideos = () => {
      const savedVideos = JSON.parse(localStorage.getItem('uploadedVideos') || '[]');
      const valid = savedVideos
        .filter(item => item && (item.name || item.file?.name))
        .map(item => item.name || item.file?.name)
        .filter(Boolean);
      setUploadedVideos(valid);
      if (valid.length > 0 && !selectedVideo) {
        setSelectedVideo(valid[0]);
      }
    };

    updateVideos();
    window.addEventListener('videosUpdated', updateVideos);
    return () => window.removeEventListener('videosUpdated', updateVideos);
  }, []);

  const handleGenerateReport = () => {
    const videoName = selectedVideo || 'No video selected';
    const athleteName = selectedAthlete || 'Athlete';
    const report = {
      id: Date.now(),
      name: `${athleteName} - ${videoName}`,
      type: 'Video Report',
      date: new Date().toISOString().slice(0, 10),
      athlete: athleteName,
      range: selectedRange,
      video: videoName,
    };

    setMessage(
      selectedVideo
        ? `Report created for ${athleteName} using ${videoName}.`
        : 'No video selected, but the report was still created.'
    );

    const existing = JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY) || '[]');
    const next = [report, ...existing];
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('reportsUpdated'));
  };

  return (
    <Card glass className="p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Report</h3>
          <p className="text-sm text-gray-500">Create a report from the uploaded video and athlete data.</p>
        </div>
      </div>
      <div className="space-y-4">
        <select
          value={selectedAthlete}
          onChange={(e) => setSelectedAthlete(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">Select Athlete...</option>
          {athletes.map((athlete) => (
            <option key={athlete} value={athlete}>{athlete}</option>
          ))}
        </select>

        <select
          value={selectedVideo}
          onChange={(e) => setSelectedVideo(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">Select uploaded video...</option>
          {uploadedVideos.length > 0 ? (
            uploadedVideos.map((video) => (
              <option key={video} value={video}>{video}</option>
            ))
          ) : (
            <option value="">No videos uploaded yet</option>
          )}
        </select>

        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-bg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="Last 3 Months">Last 3 Months</option>
          <option value="Year to Date">Year to Date</option>
        </select>

        <div className="flex space-x-3 pt-2">
          <Button className="flex-1" onClick={handleGenerateReport}>
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
        </div>

        {message && (
          <p className="text-sm text-emerald-500">{message}</p>
        )}
      </div>
    </Card>
  );
}
