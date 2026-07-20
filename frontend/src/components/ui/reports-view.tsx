import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Download, FileText, Calendar, ShieldCheck } from 'lucide-react';
import { PdfReport } from './pdf-report';

interface ReportsViewProps {
    token: string;
}

export const ReportsView = ({ token }: ReportsViewProps) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // State for the hidden PDF report
    const [pdfData, setPdfData] = useState<{session: any, recommendations: string, previousSession?: any, athleteProfile?: any} | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/sessions/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch sessions');
                const data = await res.json();
                setSessions(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSessions();
    }, [token]);

    const handleDownload = async (sessionId: string, videoName: string) => {
        setIsDownloading(sessionId);
        try {
            // 1. Fetch full session data (which includes key_moments Base64 strings)
            const sessionRes = await fetch(`http://localhost:8000/api/sessions/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!sessionRes.ok) throw new Error('Failed to fetch session details');
            const sessionData = await sessionRes.json();

            // 2. Fetch recommendation text
            const recRes = await fetch(`http://localhost:8000/api/recommendations/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const recData = await recRes.json();
            
            let recommendations: any = "No recommendations generated yet.";
            if (recRes.ok && recData.recommendations) {
                recommendations = recData.recommendations;
            }

            // Find previous session if it exists
            const sessionIndex = sessions.findIndex(s => s.session_id === sessionId);
            let previousSession = undefined;
            
            // If we found the session and it's not the last one, get the older one (which is index + 1 because the array is newest-first)
            if (sessionIndex !== -1 && sessionIndex < sessions.length - 1) {
                const prevSessionSummary = sessions[sessionIndex + 1];
                
                // Fetch full details of previous session
                const prevRes = await fetch(`http://localhost:8000/api/sessions/${prevSessionSummary.session_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (prevRes.ok) {
                    previousSession = await prevRes.json();
                }
            }

            // Also fetch athlete profile
            const profileRes = await fetch('http://localhost:8000/api/profile/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const athleteProfile = profileRes.ok ? await profileRes.json() : null;

            // Fetch real full name from MySQL via /api/auth/me
            const meRes = await fetch('http://localhost:8000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const meData = meRes.ok ? await meRes.json() : null;
            const fullName = meData?.user?.full_name || null;
            const mergedProfile = athleteProfile ? { ...athleteProfile, full_name: fullName } : { full_name: fullName };

            // 3. Set data to render the hidden component
            setPdfData({ session: sessionData, recommendations, previousSession, athleteProfile: mergedProfile });

            // 4. Wait for React to render the component
            await new Promise(resolve => setTimeout(resolve, 500));

            // 5. Trigger multi-page PDF generation using html-to-image
            const htmlToImage = await import('html-to-image');
            const jsPDF = (await import('jspdf')).default;
            
            if (!reportRef.current) throw new Error('Report component not mounted');
            
            // Get all page elements
            const pages = reportRef.current.querySelectorAll('.pdf-page');
            if (!pages || pages.length === 0) throw new Error('No pages found');
            
            // Create PDF
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            // Process each page
            for (let i = 0; i < pages.length; i++) {
                const pageEl = pages[i] as HTMLElement;
                const dataUrl = await htmlToImage.toPng(pageEl, { quality: 1, backgroundColor: '#ffffff', pixelRatio: 2 });
                
                if (i > 0) pdf.addPage();
                
                const pdfHeight = (pageEl.offsetHeight * pdfWidth) / pageEl.offsetWidth;
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }
            
            const cleanName = videoName.replace(/\.[^/.]+$/, "");
            pdf.save(`MoveIQ_Report_${cleanName}.pdf`);

        } catch (err) {
            console.error(err);
            alert("Failed to download Premium PDF.");
        } finally {
            setTimeout(() => {
                setIsDownloading(null);
                setPdfData(null);
            }, 1000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <p className="text-rose-400">{error}</p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-xl max-w-2xl mx-auto w-full mt-12">
                <ShieldCheck className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Document Center Empty</h2>
                <p className="text-slate-400">Upload and analyze a video to generate Analysis Reports.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto w-full space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-cyan-400" />
                    Document Center
                </h1>
                <p className="text-slate-400">Download PDF reports of your biomechanical risk scores.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sessions.map((session) => (
                    <div key={session.session_id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                <FileText className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{session.video_name || "Unknown Video"} Analysis</h3>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(session.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDownload(session.session_id, session.video_name || "Unknown")}
                            disabled={isDownloading !== null}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group ${
                                isDownloading === session.session_id 
                                    ? 'bg-cyan-600 text-white cursor-wait'
                                    : 'bg-slate-800 hover:bg-cyan-600 text-slate-400 hover:text-white'
                            }`}
                            title="Download Premium PDF"
                        >
                            {isDownloading === session.session_id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Hidden PDF Report Container */}
            {/* Hidden container for PDF rendering */}
            <div className="absolute left-[-9999px] top-0 pointer-events-none">
                {pdfData && (
                    <div id="pdf-report-container">
                        <PdfReport 
                            ref={reportRef} 
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
