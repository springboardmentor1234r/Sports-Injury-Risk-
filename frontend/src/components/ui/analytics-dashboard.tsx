import { cn } from "@/lib/utils";
import React, { useRef, useEffect, useState } from 'react';
import { HeartPulse, AlertTriangle, Bone, FileText, Download, X, Loader2, Play } from 'lucide-react';
import jsPDF from 'jspdf';
import { PdfAnalyticsOnly } from './pdf-analytics-only';
import { PdfRecommendationOnly } from './pdf-recommendation-only';
export interface MoveIQDashboardProps {
    token?: string;
    sessionId?: string;
    videoName?: string;
    healthScore?: number;
    riskCategory?: string;
    efficiency?: number;
    sessionsAnalyzed?: number;
    flaggedIssues?: string[];
    isProcessing?: boolean;
    videoUrl?: string;
}

export const MinimalProfessionalCard: React.FC<MoveIQDashboardProps> = ({
    token,
    sessionId,
    videoName,
    healthScore,
    riskCategory,
    efficiency,
    sessionsAnalyzed,
    flaggedIssues,
    isProcessing = false,
    videoUrl
}) => {
    const hasData = healthScore !== undefined && !isProcessing;
    const cardRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [progress] = useState(healthScore || 0);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [history, setHistory] = useState<any[]>([]);
    
    // New states for the analytics modal
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [fullSessionData, setFullSessionData] = useState<any>(null);
    const analyticsReportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!token) return;
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();
    }, [token, sessionId]);

    // Recommendation State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);

    // Video State
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    const handlePlayVideo = () => {
        if (!videoUrl) {
            alert("Video storage is currently disabled in development (Cloudinary API key commented out). When you re-enable it, the video will play here!");
            return;
        }
        setIsVideoModalOpen(true);
    };

    const handleViewAnalytics = async () => {
        if (!sessionId) return;
        setIsFetchingAnalytics(true);
        try {
            const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!sessionRes.ok) throw new Error('Failed to fetch session details');
            const sessionData = await sessionRes.json();
            setFullSessionData(sessionData);
            setIsAnalyticsModalOpen(true);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetchingAnalytics(false);
        }
    };

    const handleDownloadAnalyticsPDF = async () => {
        try {
            const htmlToImage = await import('html-to-image');
            const jsPDF = (await import('jspdf')).default;
            
            const element = document.getElementById('analytics-pdf-container');
            if (!element) return;
            
            const pages = element.querySelectorAll('.pdf-page');
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            for (let i = 0; i < pages.length; i++) {
                const pageEl = pages[i] as HTMLElement;
                const dataUrl = await htmlToImage.toPng(pageEl, { quality: 1, backgroundColor: '#ffffff', pixelRatio: 2 });
                if (i > 0) pdf.addPage();
                
                const pdfHeight = (pageEl.offsetHeight * pdfWidth) / pageEl.offsetWidth;
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }
            
            const fileName = videoName ? `MoveIQ_Analytics_${videoName.replace(/\.[^/.]+$/, "")}.pdf` : `MoveIQ_Analytics_${sessionId}.pdf`;
            pdf.save(fileName);
        } catch (e) {
            console.error("PDF generation failed:", e);
        }
    };

    const handleGetRecommendation = async () => {
        if (!token || !sessionId) return;
        setIsGenerating(true);
        setIsModalOpen(true);
        setReportData(null);

        try {
            // 1. Generate recommendations if they don't exist yet
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/recommendations/${sessionId}/generate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 2. Fetch the generated recommendations
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/recommendations/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to fetch recommendation");
            setReportData(data.recommendations);
        } catch (err: any) {
            console.error(err);
            setReportData({ error: "Failed to load recommendations. Please try again." });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadTXT = () => {
        if (!reportData || reportData.error) return;
        
        let textContent = `MoveIQ AI Biomechanics Recommendation\n`;
        const identifier = videoName ? videoName.replace(/\.[^/.]+$/, "") : `MIQ-${sessionId?.substring(0, 8).toUpperCase() || "TEMP"}`;
        textContent += `Report for: ${identifier}\n\n`;
        textContent += `SUMMARY:\n${reportData.one_line_summary}\n\n`;
        
        if (reportData.categories && reportData.categories.length > 0) {
            textContent += `SPECIFIC ISSUES & EXERCISES:\n`;
            reportData.categories.forEach((cat: any) => {
                textContent += `- ${cat.category_name.replace(/_/g, ' ').toUpperCase()}:\n`;
                textContent += `  ${cat.issue_translation}\n`;
                textContent += `  Recommended Exercises:\n`;
                cat.recommended_exercises?.forEach((ex: string) => {
                    textContent += `    * ${ex}\n`;
                });
                textContent += `\n`;
            });
        }
        
        textContent += `WRAP UP:\n${reportData.wrap_up_summary}\n`;

        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = videoName ? `MoveIQ_Recommendation_${videoName.replace(/\.[^/.]+$/, "")}.txt` : `MoveIQ_Recommendation_${sessionId}.txt`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPDF = async () => {
        if (!reportData || reportData.error) return;
        try {
            const htmlToImage = await import('html-to-image');
            const jsPDF = (await import('jspdf')).default;
            
            const element = document.getElementById('recommendation-pdf-container');
            if (!element) return;
            
            const pages = element.querySelectorAll('.pdf-page');
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            for (let i = 0; i < pages.length; i++) {
                const pageEl = pages[i] as HTMLElement;
                const dataUrl = await htmlToImage.toPng(pageEl, { quality: 1, backgroundColor: '#ffffff', pixelRatio: 2 });
                if (i > 0) pdf.addPage();
                
                const pdfHeight = (pageEl.offsetHeight * pdfWidth) / pageEl.offsetWidth;
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }
            
            const fileName = videoName ? `MoveIQ_Recommendation_${videoName.replace(/\.[^/.]+$/, "")}.pdf` : `MoveIQ_Recommendation_${sessionId}.pdf`;
            pdf.save(fileName);
        } catch (e) {
            console.error("PDF generation failed:", e);
        }
    };

    const circumference = 2 * Math.PI * 20;
    const strokeDashoffset = circumference - (circumference * progress) / 100;

    const safeHealthScore = healthScore || 0;
    const healthColor = !hasData ? 'from-slate-600 to-slate-500' :
                        safeHealthScore >= 80 ? 'from-green-400 to-emerald-600' : 
                        safeHealthScore >= 50 ? 'from-yellow-400 to-amber-600' : 
                        'from-red-400 to-rose-600';

    return (
        <div className="flex flex-col h-full bg-slate-950">
            <div className={`flex-1 p-8 flex items-center justify-center transition-opacity duration-300 ${isProcessing ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                <div 
                    ref={cardRef}
                    className={`print:hidden w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${
                        isDarkMode 
                            ? 'bg-slate-900 border-slate-800 shadow-slate-900/50' 
                            : 'bg-white border-slate-200 shadow-slate-200/50'
                    } ${isProcessing ? 'animate-pulse ring-4 ring-cyan-500/20' : ''}`}
                >
                    <div className="flex items-start justify-between p-8">
                    <div>
                        <h1 className={`text-2xl font-bold tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            MoveIQ Athlete Dashboard
                        </h1>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Biomechanics & Risk Analysis
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                                isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                            }`}
                            aria-label="Toggle dark mode"
                        >
                            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                                isDarkMode ? 'translate-x-7' : 'translate-x-0.5'
                            }`}>
                                {isDarkMode ? (
                                    <svg className="w-3.5 h-3.5 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
                                    </svg>
                                )}
                            </div>
                        </button>
                        
                        <div className="relative">
                            <svg width="60" height="60" className="animate-[float_3s_ease-in-out_infinite]">
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    cx="30"
                                    cy="30"
                                    r="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    className={isDarkMode ? 'text-slate-700' : 'text-slate-200'}
                                />
                                <circle
                                    cx="30"
                                    cy="30"
                                    r="20"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-1000 ease-out -rotate-90 origin-center"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{progress}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 mb-6">
                    <div className={`flex space-x-1 relative border-b overflow-x-auto whitespace-nowrap ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        {['overview', 'biomechanics', 'injury risks'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                disabled={!hasData}
                                className={`px-4 py-2 text-sm font-semibold capitalize transition-colors relative z-10 flex-shrink-0 ${
                                    !hasData 
                                        ? 'text-slate-600 cursor-not-allowed'
                                        : activeTab === tab
                                            ? isDarkMode ? 'text-cyan-400' : 'text-blue-600'
                                            : isDarkMode 
                                                ? 'text-slate-400 hover:text-slate-200'
                                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                        {hasData && (
                            <div 
                                className="absolute bottom-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 ease-in-out"
                                style={{
                                    left: activeTab === 'overview' ? '0px' : activeTab === 'biomechanics' ? '96px' : '224px',
                                    width: activeTab === 'injury risks' ? '104px' : '96px'
                                }}
                            />
                        )}
                    </div>
                </div>

                <div className="px-8 pb-8 flex-1">
                    {activeTab === 'overview' ? (
                        <>
                            <div className={`rounded-xl p-5 border mb-4 ${
                                isDarkMode 
                                    ? 'bg-slate-800/40 border-slate-700/50' 
                                    : 'bg-slate-50 border-slate-100'
                            }`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <HeartPulse className={`w-4 h-4 ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Overall Health Score</span>
                                        {!hasData && !isProcessing && (
                                            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full ml-2">No Video Analyzed</span>
                                        )}
                                        {isProcessing && (
                                            <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full ml-2 animate-pulse">Analyzing Video...</span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                        (!hasData && !isProcessing) ? (isDarkMode ? 'text-slate-400 bg-slate-800 border border-slate-700' : 'text-slate-500 bg-slate-100 border border-slate-200') :
                                        isProcessing ? 'text-cyan-400 bg-cyan-900 border border-cyan-800' :
                                        safeHealthScore >= 80 ? (isDarkMode ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-emerald-600 bg-emerald-50 border border-emerald-100') :
                                        safeHealthScore >= 50 ? (isDarkMode ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' : 'text-amber-600 bg-amber-50 border border-amber-100') :
                                        (isDarkMode ? 'text-rose-400 bg-rose-400/10 border border-rose-400/20' : 'text-rose-600 bg-rose-50 border border-rose-100')
                                    }`}>
                                        {isProcessing ? 'Calculating' : !hasData ? 'N/A' : safeHealthScore >= 80 ? 'Optimal' : safeHealthScore >= 50 ? 'Moderate' : 'High Risk'}
                                    </span>
                                </div>
                                <p className={`text-3xl font-bold tracking-tight mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{!hasData ? '--' : safeHealthScore} <span className={`text-lg font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>/ 100</span></p>
                                <div className={`mt-4 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}>
                                    <div 
                                        className={`h-full bg-gradient-to-r ${healthColor} rounded-full transition-all duration-1000`}
                                        style={{ width: `${hasData ? safeHealthScore : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Sessions', value: (!hasData && !isProcessing) ? '--' : isProcessing ? '...' : sessionsAnalyzed },
                                    { label: 'Risk Cat', value: (!hasData && !isProcessing) ? 'N/A' : isProcessing ? '...' : riskCategory },
                                    { label: 'Efficiency', value: (!hasData && !isProcessing) ? '--' : isProcessing ? '...' : `${efficiency}%` }
                                ].map((metric) => (
                                    <div key={metric.label} className={`rounded-xl p-4 border flex flex-col items-center justify-center ${
                                        isDarkMode 
                                            ? 'bg-slate-800/40 border-slate-700/50' 
                                            : 'bg-slate-50 border-slate-100'
                                    }`}>
                                        <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{metric.label}</p>
                                        <p className={`text-lg font-bold ${
                                            !hasData || isProcessing ? 'text-slate-500' :
                                            metric.value === 'High' ? 'text-rose-500' : 
                                            metric.value === 'Moderate' ? 'text-amber-500' : 
                                            isDarkMode ? 'text-white' : 'text-slate-800'
                                        }`}>{metric.value}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : activeTab === 'biomechanics' ? (
                        <div className="space-y-3">
                            {[
                                { color: 'bg-cyan-500', label: 'Max Knee Flexion', value: '112°', status: 'Good' },
                                { color: 'bg-rose-500', label: 'Knee Valgus (L)', value: '14°', status: 'Warning' },
                                { color: 'bg-emerald-500', label: 'Trunk Lean', value: '5°', status: 'Optimal' },
                                { color: 'bg-amber-500', label: 'Jump Asymmetry', value: '8%', status: 'Monitor' }
                            ].map((item, index) => (
                                <div key={item.label} className={`flex items-center justify-between py-3 px-2 ${
                                    index < 3 ? `border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}` : ''
                                }`}>
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-[0_0_10px_rgba(0,0,0,0.5)] shadow-${item.color}`}></div>
                                        <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-semibold ${
                                            item.status === 'Warning' ? 'text-rose-500' :
                                            item.status === 'Monitor' ? 'text-amber-500' :
                                            'text-emerald-500'
                                        }`}>{item.status}</span>
                                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'injury risks' ? (
                        <div className="space-y-3">
                            <div className={`rounded-xl p-4 border ${
                                isDarkMode 
                                    ? 'bg-gradient-to-r from-rose-900/10 to-orange-900/10 border-rose-900/30' 
                                    : 'bg-gradient-to-r from-rose-50 to-orange-50 border-rose-100'
                            }`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className={`w-4 h-4 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                                    <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Detected Flaws</h3>
                                </div>
                                <ul className="space-y-2.5">
                                    {flaggedIssues && flaggedIssues.length > 0 ? (
                                        flaggedIssues.map((issue, idx) => (
                                            <li key={idx} className="flex items-start space-x-2.5 bg-black/20 p-2 rounded-lg">
                                                <Bone className={`w-3.5 h-3.5 mt-0.5 ${isDarkMode ? 'text-rose-400' : 'text-rose-500'}`} />
                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{issue}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>No significant risks detected in this session!</p>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className={`flex gap-3 px-6 pb-6 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button 
                        onClick={handleViewAnalytics}
                        disabled={!hasData || isProcessing || isFetchingAnalytics}
                        className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isFetchingAnalytics ? <Loader2 className="w-5 h-5 animate-spin" /> : 'View Full Report'}
                    </button>
                    <button 
                        onClick={handleGetRecommendation}
                        disabled={!hasData || isProcessing}
                        className={`flex-1 font-bold py-3 px-4 rounded-xl transition-all border flex items-center justify-center gap-2 ${
                            isDarkMode 
                                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' 
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <FileText className="w-4 h-4" /> Get Recommendation
                    </button>
                </div>
            </div>
            </div>

            {/* Recommendation Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white tracking-tight">AI Recommendation Report</h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 relative bg-slate-900/30">
                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                                    <div>
                                        <p className="text-white font-semibold">Generating Personalized Report...</p>
                                        <p className="text-sm text-slate-400 mt-1">This may take 10-20 seconds as our LLM analyzes your biomechanics.</p>
                                    </div>
                                </div>
                            ) : reportData ? (
                                <div className="space-y-6">
                                    {reportData.error ? (
                                        <p className="text-rose-400">{reportData.error}</p>
                                    ) : (
                                        <>
                                            <div className="bg-cyan-900/20 border border-cyan-800 p-4 rounded-xl">
                                                <h4 className="text-cyan-400 font-bold mb-2">Summary</h4>
                                                <p className="text-slate-300 text-sm leading-relaxed">{reportData.one_line_summary}</p>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <h4 className="text-white font-bold">Specific Issues & Exercises</h4>
                                                {reportData.categories?.map((cat: any, idx: number) => (
                                                    <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                                                        <h5 className="text-amber-400 font-bold capitalize mb-1">{cat.category_name.replace(/_/g, ' ')}</h5>
                                                        <p className="text-slate-300 text-sm mb-3">{cat.issue_translation}</p>
                                                        <div className="bg-black/30 p-3 rounded-lg">
                                                            <p className="text-xs text-slate-400 uppercase font-bold mb-2 tracking-wider">Recommended Exercises</p>
                                                            <ul className="list-disc pl-5 space-y-1">
                                                                {cat.recommended_exercises?.map((ex: string, i: number) => (
                                                                    <li key={i} className="text-emerald-400 text-sm">{ex}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl">
                                                <p className="text-slate-400 text-sm italic">{reportData.wrap_up_summary}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        {/* Modal Footer with Downloads */}
                        {!isGenerating && reportData && !reportData.error && (
                            <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-3">
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

            {/* Analytics Full Report Modal Overlay */}
            {isAnalyticsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white tracking-tight">AI Biomechanics Analytics</h3>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleDownloadAnalyticsPDF}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-blue-500/20"
                                >
                                    <Download className="w-4 h-4" /> Download PDF
                                </button>
                                <button 
                                    onClick={() => setIsAnalyticsModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body with scaled preview */}
                        <div className="flex-1 overflow-y-auto p-6 relative bg-slate-900/30">
                            {fullSessionData ? (
                                <div className="relative w-[800px] mx-auto bg-white transform origin-top shrink-0 mb-10 shadow-2xl rounded overflow-hidden print:hidden">
                                    <PdfAnalyticsOnly session={fullSessionData} ref={analyticsReportRef} />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Playback Modal */}
            {isVideoModalOpen && videoUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div 
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        onClick={() => setIsVideoModalOpen(false)}
                    />
                    
                    <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Play className="w-4 h-4 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Biomechanics Analysis Video</h3>
                            </div>
                            <button 
                                onClick={() => setIsVideoModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body: Video Player */}
                        <div className="flex-1 bg-black w-full aspect-video">
                            <video 
                                src={videoUrl}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Container injected at root level to prevent clipping */}
            <div className="absolute left-[-9999px] top-0 pointer-events-none">
                {fullSessionData && isAnalyticsModalOpen && (
                    <div id="analytics-pdf-container">
                        <PdfAnalyticsOnly session={fullSessionData} />
                    </div>
                )}
                {reportData && !reportData.error && isModalOpen && (
                    <div id="recommendation-pdf-container">
                        <PdfRecommendationOnly session={{
                            session_id: sessionId,
                            created_at: new Date().toISOString(),
                            risk_data: { risk_category: riskCategory }
                        }} recommendations={reportData} />
                    </div>
                )}
            </div>
        </div>
    );
};
