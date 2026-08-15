import React, { useState, useRef } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { PdfAthleteReport } from '../pdf-athlete-report';
import toast from 'react-hot-toast';

interface ReportsViewProps {
  sessions: any[];
  onOpenReportModal: (session: any) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sessions,
  onOpenReportModal,
  onDeleteSession,
}) => {
  const [filterRisk, setFilterRisk] = useState<string>('All Reports');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<{ session: any, recommendations: any, previousSession?: any, athleteProfile?: any } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const getRiskLabel = (s: any) => {
    return s?.risk_data?.risk_category ?? 'Low Risk';
  };

  const getIssuesString = (issues: any) => {
    if (!issues) return 'Movement patterns analyzed by AI Biomechanics Engine.';
    if (typeof issues === 'string') {
      if (issues === 'None') return 'No issues flagged.';
      return issues;
    }
    if (Array.isArray(issues)) {
      if (issues.length === 0) return 'No issues flagged.';
      return issues.map((i: any) => i.issue || i).join(', ');
    }
    return 'Movement patterns analyzed by AI Biomechanics Engine.';
  };

  const filtered = sessions.filter((s) => {
    if (filterRisk === 'All Reports') return true;
    return getRiskLabel(s).toLowerCase() === filterRisk.toLowerCase();
  });

  const getRiskBadge = (risk: string) => {
    if (risk === 'High Risk') {
      return 'text-[#ba1a1a] bg-[#ffdad6] border-[#f5c6cb]';
    } else if (risk === 'Medium Risk' || risk === 'Moderate Risk') {
      return 'text-[#b35900] bg-[#fff0e6] border-[#ffe0b2]';
    } else {
      return 'text-[#11801c] bg-[#e6f4ea] border-[#ceebd4]';
    }
  };

  const handleDownloadReport = async (s: any) => {
    const format = localStorage.getItem("downloadFormat") || "pdf";
    if (format === "txt") {
      const reportText = `MoveIQ OFFICIAL BIOMECHANICAL REPORT
-----------------------------------------
Session ID: ${s.session_id}
File Name: ${s.video_name}
Assessment Date: ${s.created_at ? new Date(s.created_at).toLocaleString() : 'N/A'}
Overall Health Score: ${s.risk_data?.overall_health_score || 100}/100
Biomechanical Efficiency: ${s.risk_data?.biomechanical_efficiency_score || 100}%
Risk Classification: ${getRiskLabel(s)}
Peak Valgus Angle: ${s.risk_data?.valgus_angle || 0}°

SUMMARY OF FINDINGS:
${getIssuesString(s.risk_data?.flagged_issues)}

-----------------------------------------
MoveIQ Injury Prevention System
`;
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MoveIQ_Report_${(s.video_name || "Assessment").replace('.mp4', '')}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        setIsDownloading(s.session_id);
        const token = localStorage.getItem("token");

        // Fetch recommendations if not present or string
        let recommendations = s.recommendations;
        if (!recommendations || typeof recommendations !== 'object') {
          try {
            const recRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/recommendations/${s.session_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (recRes.ok) {
              const recData = await recRes.json();
              if (recData.recommendations) recommendations = recData.recommendations;
            }
          } catch (e) {
            console.error("Could not fetch recommendations", e);
          }
        }

        // Find previous session if available in sessions list
        let previousSession = undefined;
        try {
          const idx = sessions.findIndex(sess => sess.session_id === s.session_id);
          if (idx !== -1 && idx < sessions.length - 1) {
            previousSession = sessions[idx + 1];
          }
        } catch (e) {
          console.error("Could not find previous session", e);
        }

        // Try fetching user profile and demographic data
        let athleteProfile = null;
        try {
          const [meRes, profRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profile`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);
          let profData = {};
          if (profRes.ok) profData = await profRes.json();
          if (meRes.ok) {
            const meData = await meRes.json();
            athleteProfile = { ...(meData.user || {}), ...profData };
          }
        } catch (e) {
          console.error("Could not fetch profile", e);
        }

        setPdfData({
          session: s,
          recommendations: recommendations || "No specific recommendations found.",
          previousSession,
          athleteProfile
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        const htmlToImage = await import('html-to-image');
        const jsPDF = (await import('jspdf')).default;
        
        if (!reportRef.current) throw new Error('Report component not mounted');
        
        const pages = reportRef.current.querySelectorAll('.pdf-page');
        if (!pages || pages.length === 0) throw new Error('No pages found');
        
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        
        for (let i = 0; i < pages.length; i++) {
          const pageEl = pages[i] as HTMLElement;
          const dataUrl = await htmlToImage.toPng(pageEl, { quality: 1, backgroundColor: '#ffffff', pixelRatio: 2, skipFonts: true });
          
          if (i > 0) pdf.addPage();
          
          const pdfHeight = (pageEl.offsetHeight * pdfWidth) / pageEl.offsetWidth;
          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        
        const cleanName = (s.video_name || "Assessment").replace(/\.[^/.]+$/, "");
        pdf.save(`MoveIQ_Athlete_Report_${cleanName}.pdf`);
      } catch (err) {
        console.error("Failed to download PDF report", err);
        toast.error("Failed to download high-fidelity PDF report.");
      } finally {
        setTimeout(() => {
          setIsDownloading(null);
          setPdfData(null);
        }, 1000);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left text-[#191b23]">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold text-[#191b23]">Reports</h1>
        <p className="text-[16px] text-[#434654] mt-2 font-medium">
          Comprehensive biomechanical assessments and injury risk reports.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#c3c6d7] pb-4">
        {['All Reports', 'High Risk', 'Medium Risk', 'Low Risk'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterRisk(tab)}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              filterRisk === tab
                ? 'bg-[#00379b] text-white'
                : 'bg-white text-[#434654] border border-[#c3c6d7] hover:bg-[#f3f3fe]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid of Reports */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((s) => {
            const riskCat = getRiskLabel(s);
            return (
              <div
                key={s.session_id}
                className="bg-white border border-[#c3c6d7] rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Image Header with Badge */}
                  <div className="relative h-48 bg-[#191b23] overflow-hidden group">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNL75wMLGsaQgGw0-wH_sIbBed-6Ljx9wLNsQwfuKmUihZYFxbDgkeZjhiESrfN9f1a8Fc6TfIQhIyHoGQHr61kAmNXeqRgZvHdB94ri7cKlP77ubBw09165GdV4R4P8x_stXZqlIMwBEln_t4y7b-SC68_I7dX3e_lWO_hmGmlhp45H9F8IpUmthxOxlIiZU61Bh6U2KO5dYNPS6Z7pOD3QPzdhX8-tcaazDLUtB6J5FaHxGlm4cM2_aT14E1BjEt5lvg3MDMEhDX"
                      alt={s.video_name}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded text-[11px] font-bold tracking-wider uppercase border ${getRiskBadge(
                          riskCat
                        )}`}
                      >
                        {riskCat}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(s.session_id);
                        }}
                        className="p-1.5 bg-black/60 hover:bg-[#ba1a1a] text-white rounded-lg transition-colors border border-transparent shadow"
                        title="Delete Assessment Report"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[12px] px-2.5 py-1 rounded font-mono">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <h3 className="text-[20px] font-bold text-[#191b23] mb-1">
                      Biomechanical Analysis
                    </h3>
                    <p className="font-mono text-[13px] text-[#737686] mb-4 truncate" title={s.video_name}>
                      {s.video_name}
                    </p>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-[#faf8ff] rounded-lg border border-[#c3c6d7] text-center mb-4">
                      <div>
                        <div className="text-[11px] font-semibold text-[#434654] uppercase">
                          Health
                        </div>
                        <div className="text-[16px] font-bold text-[#11801c]">
                          {s.risk_data?.overall_health_score || 100}/100
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-[#434654] uppercase">
                          Efficiency
                        </div>
                        <div className="text-[16px] font-bold text-[#00379b]">
                          {s.risk_data?.biomechanical_efficiency_score || 100}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-[#434654] uppercase">
                          Valgus
                        </div>
                        <div className="text-[16px] font-bold text-[#ba1a1a]">
                          {s.risk_data?.valgus_angle !== undefined ? `${s.risk_data.valgus_angle.toFixed(1)}°` : '--'}
                        </div>
                      </div>
                    </div>

                    <p className="text-[13px] text-[#434654] line-clamp-2">
                      {getIssuesString(s.risk_data?.flagged_issues)}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => onOpenReportModal(s)}
                    className="flex-1 bg-[#faf8ff] border border-[#c3c6d7] text-[#00379b] py-2.5 rounded-lg font-semibold text-[12px] uppercase tracking-wider hover:bg-[#f3f3fe] transition-colors"
                  >
                    Preview Analysis
                  </button>
                  <button
                    onClick={() => handleDownloadReport(s)}
                    disabled={isDownloading === s.session_id}
                    className="flex-1 bg-[#004ccd] hover:bg-[#00379b] disabled:bg-[#004ccd]/70 text-white py-2.5 rounded-lg font-semibold text-[12px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                  >
                    {isDownloading === s.session_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">
                        download
                      </span>
                    )}
                    {isDownloading === s.session_id ? "Generating..." : `Download ${typeof window !== 'undefined' && localStorage.getItem("downloadFormat") === "txt" ? "TXT" : "PDF"}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-[#c3c6d7] rounded-xl text-[#737686]">
          No reports found matching selection filter.
        </div>
      )}

      {/* Hidden Container for Athlete PDF generation */}
      <div className="absolute left-[-9999px] top-0 pointer-events-none">
        {pdfData && (
          <div id="athlete-pdf-container" ref={reportRef}>
            <PdfAthleteReport
              session={pdfData.session}
              recommendations={pdfData.recommendations}
              previousSession={pdfData.previousSession}
              athleteProfile={pdfData.athleteProfile}
            />
          </div>
        )}
      </div>

    </div>
  );
};
