import React, { useState, useEffect } from 'react';
import { Loader2, FileText, ChevronRight, AlertCircle, X, Download, Activity, CheckCircle2 } from 'lucide-react';
import { PdfRecommendationOnly } from './pdf-recommendation-only';

interface RecommendationsHistoryProps {
    token: string;
}

export const RecommendationsHistory = ({ token }: RecommendationsHistoryProps) => {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFetchingReport, setIsFetchingReport] = useState(false);
    const [activeRecommendation, setActiveRecommendation] = useState<any>(null);
    const [activeSession, setActiveSession] = useState<any>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/recommendations/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch recommendations history');
                const data = await res.json();
                setHistory(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [token]);

    const handleOpenReport = async (sessionItem: any) => {
        setIsModalOpen(true);
        setIsFetchingReport(true);
        setActiveRecommendation(null);
        setActiveSession(sessionItem);
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/recommendations/${sessionItem.session_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to fetch recommendation");
            setActiveRecommendation(data.recommendations);
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsFetchingReport(false);
        }
    };

    const generateTextReport = (rec: any) => {
        let text = `${rec.one_line_summary}\n\n`;
        
        if (rec.categories && rec.categories.length > 0) {
            rec.categories.forEach((cat: any) => {
                text += `Category: ${cat.category_name.replace(/_/g, ' ')}\n`;
                text += `What this means: ${cat.explanation}\n`;
                text += `Recommended Exercises:\n`;
                cat.recommended_exercises.forEach((ex: string) => {
                    text += `  • ${ex}\n`;
                });
                text += `\n`;
            });
        }
        
        text += `${rec.wrap_up_summary}`;
        return text;
    };

    const handleDownloadTXT = () => {
        if (!activeRecommendation) return;
        const text = generateTextReport(activeRecommendation);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeSession?.video_name 
            ? `MoveIQ_Recommendation_${activeSession.video_name.replace(/\.[^/.]+$/, "")}.txt` 
            : 'MoveIQ_AI_Recommendation.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleDownloadPDF = async () => {
        if (!activeRecommendation || !activeSession) return;
        
        try {
            const htmlToImage = await import('html-to-image');
            const jsPDF = (await import('jspdf')).default;
            
            const element = document.getElementById('history-recommendation-pdf-container');
            if (!element) return;
            
            const pages = element.querySelectorAll('.pdf-page');
            if (!pages || pages.length === 0) return;
            
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            for (let i = 0; i < pages.length; i++) {
                const pageEl = pages[i] as HTMLElement;
                const dataUrl = await htmlToImage.toPng(pageEl, { quality: 1, backgroundColor: '#ffffff', pixelRatio: 2 });
                if (i > 0) pdf.addPage();
                
                const pdfHeight = (pageEl.offsetHeight * pdfWidth) / pageEl.offsetWidth;
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }
            
            const fileName = activeSession.video_name 
                ? `MoveIQ_Recommendation_${activeSession.video_name.replace(/\.[^/.]+$/, "")}.pdf` 
                : `MoveIQ_Recommendation_${activeSession.session_id}.pdf`;
                
            pdf.save(fileName);
        } catch (e) {
            console.error("PDF generation failed:", e);
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
            <div className="text-center p-8 bg-rose-500/10 border border-slate-700/50 rounded-2xl">
                <p className="text-rose-400">{error}</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-xl max-w-2xl mx-auto w-full mt-12">
                <AlertCircle className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Recommendations Yet</h2>
                <p className="text-slate-400">Run a recommendation report from your dashboard to see it here.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto w-full space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-cyan-400" />
                    Recommendations History
                </h1>
                <p className="text-slate-400">Review your past AI-generated corrective exercise plans.</p>
            </div>

            <div className="space-y-4">
                {history.map((item) => (
                    <div 
                        key={item.session_id} 
                        className="bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer rounded-2xl p-6 backdrop-blur-xl group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        onClick={() => handleOpenReport(item)}
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-white text-lg">{item.video_name}</h3>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">
                                    {new Date(item.created_at).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm">{item.one_line_summary}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-cyan-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                        
                        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Corrective Exercise Plan</h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 relative bg-slate-950">
                            {isFetchingReport ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                                    <div>
                                        <p className="text-white font-semibold">Loading Plan...</p>
                                    </div>
                                </div>
                            ) : activeRecommendation ? (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                        <p className="text-lg text-white font-medium">{activeRecommendation.one_line_summary}</p>
                                    </div>

                                    {activeRecommendation.categories && activeRecommendation.categories.length > 0 ? (
                                        <div className="space-y-4">
                                            {activeRecommendation.categories.map((cat: any, idx: number) => (
                                                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                                    <h4 className="text-xl font-bold text-cyan-400 capitalize mb-2 flex items-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                                                        {cat.category_name.replace(/_/g, ' ')}
                                                    </h4>
                                                    <p className="text-slate-300 text-sm mb-4 leading-relaxed bg-slate-800/50 p-3 rounded-lg">
                                                        <span className="font-semibold text-slate-200">What this means:</span> {cat.explanation}
                                                    </p>
                                                    <div className="space-y-2">
                                                        <p className="font-semibold text-slate-200 text-sm uppercase tracking-wider">Recommended Exercises</p>
                                                        <ul className="space-y-2">
                                                            {cat.recommended_exercises.map((ex: string, eIdx: number) => (
                                                                <li key={eIdx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                                                                    <span>{ex}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center border border-emerald-500/20 bg-emerald-500/10 rounded-xl">
                                            <p className="text-emerald-400 font-medium">Keep up the good work! No major corrective exercises needed right now.</p>
                                        </div>
                                    )}

                                    {activeRecommendation.wrap_up_summary && (
                                        <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 text-slate-400 text-sm italic">
                                            {activeRecommendation.wrap_up_summary}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400">
                                    Failed to load recommendation data.
                                </div>
                            )}
                        </div>

                        {!isFetchingReport && activeRecommendation && (
                            <div className="p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-end gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-10">
                                <button 
                                    onClick={handleDownloadTXT}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
                                >
                                    <FileText className="w-4 h-4" /> TXT
                                </button>
                                <button 
                                    onClick={handleDownloadPDF}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Hidden container for PDF rendering */}
            <div className="absolute left-[-9999px] top-0 pointer-events-none">
                {activeRecommendation && activeSession && (
                    <div id="history-recommendation-pdf-container">
                        <PdfRecommendationOnly 
                            session={{
                                session_id: activeSession.session_id,
                                created_at: activeSession.created_at || new Date().toISOString(),
                                risk_data: activeSession.risk_data || { risk_category: "Unknown" },
                                video_name: activeSession.video_name
                            }} 
                            recommendations={activeRecommendation} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
