import React, { useState, useEffect } from 'react';
import { Loader2, Download, FileText, Calendar, ShieldCheck } from 'lucide-react';

interface ReportsViewProps {
    token: string;
}

export const ReportsView = ({ token }: ReportsViewProps) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        try {
            const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}/report/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to download report');
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Analysis_Report_${videoName}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert("Failed to download PDF.");
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
                            className="w-12 h-12 rounded-full bg-slate-800 hover:bg-cyan-600 flex items-center justify-center text-slate-400 hover:text-white transition-all group"
                            title="Download PDF"
                        >
                            <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
