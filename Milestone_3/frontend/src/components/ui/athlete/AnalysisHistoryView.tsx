import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Video, Eye, Trash2, Calendar, ShieldCheck, Heart, AlertTriangle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AnalysisHistoryViewProps {
  sessions: any[];
  onOpenSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  token?: string;
}

export const AnalysisHistoryView: React.FC<AnalysisHistoryViewProps> = ({
  sessions,
  onOpenSession,
  onDeleteSession,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All Risks');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.video_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const risk = s.risk_data?.risk_category || 'Low Risk';
    const matchesRisk =
      riskFilter === 'All Risks' || risk.toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesRisk;
  });

  const pageSize = 5;
  const totalPages = Math.ceil(filteredSessions.length / pageSize) || 1;
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getTrendData = () => {
    return [...sessions]
      .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
      .map((s, i, arr) => {
        const score = s.risk_data?.overall_health_score ?? 100;
        const efficiency = s.risk_data?.biomechanical_efficiency_score ?? score;
        const valgus = s.risk_data?.valgus_angle ?? 0;
        const prevScore = i > 0 ? (arr[i - 1].risk_data?.overall_health_score ?? 100) : score;
        const diff = score - prevScore;
        const diffLabel = i === 0 ? 'Baseline' : diff > 0 ? `+${diff} pts` : diff < 0 ? `${diff} pts` : 'No change';
        return {
          name: `S${i + 1}`,
          date: s.created_at ? new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `S${i + 1}`,
          video: s.video_name || `Session ${i + 1}`,
          score: score,
          efficiency: efficiency,
          valgus: Number(valgus.toFixed(1)),
          diff: diff,
          diffLabel: diffLabel
        };
      });
  };

  const chartData = getTrendData();
  const latestDiff = chartData[chartData.length - 1]?.diff ?? 0;
  const latestDiffLabel = chartData[chartData.length - 1]?.diffLabel ?? 'Baseline';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div>
        <h1 className="text-[32px] leading-[40px] font-extrabold text-[#191c1f] tracking-tight">
          Analysis History
        </h1>
        <p className="text-[14px] text-[#424656] mt-1 font-normal">
          Review past session data, health scores, and biomechanical reports.
        </p>
      </div>

      {/* Session-over-Session Progress Analytics Chart */}
      {sessions.length > 0 && (
        <div className="bg-white border border-[#c3c6d8] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#c3c6d8]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#004ccd]" />
              <h2 className="text-[20px] font-bold text-[#191c1f]">Session-over-Session Progress Analytics</h2>
            </div>
            {chartData.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#424656]">Latest vs Prev Session:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                  latestDiff > 0 ? 'bg-[#c4f2c7] text-[#11801c] border border-[#11801c]/20' :
                  latestDiff < 0 ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20' :
                  'bg-slate-100 text-[#424656] border border-slate-300'
                }`}>
                  {latestDiffLabel}
                </span>
              </div>
            )}
          </div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} fontStyle="bold" />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#191c1f] text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[190px]">
                          <p className="font-bold text-[#4094ff] border-b border-slate-700 pb-1">{data.video} ({data.date})</p>
                          <p className="flex justify-between font-semibold"><span className="text-slate-300">Health Score:</span> <strong className="text-[#4094ff]">{data.score}/100</strong></p>
                          <p className="flex justify-between font-semibold"><span className="text-slate-300">Efficiency:</span> <strong className="text-[#4ade80]">{data.efficiency}/100</strong></p>
                          <p className="flex justify-between font-semibold"><span className="text-slate-300">Valgus Angle:</span> <strong className="text-amber-300">{data.valgus}°</strong></p>
                          <div className="pt-1 border-t border-slate-700 flex justify-between items-center font-bold">
                            <span className="text-slate-300">vs Prev Session:</span>
                            <span className={data.diff > 0 ? 'text-[#4ade80]' : data.diff < 0 ? 'text-rose-400' : 'text-slate-300'}>
                              {data.diffLabel}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                <Line name="Health Score" type="monotone" dataKey="score" stroke="#004ccd" strokeWidth={3} dot={{ fill: '#004ccd', strokeWidth: 2, r: 5 }} activeDot={{ r: 8 }} />
                <Line name="Efficiency" type="monotone" dataKey="efficiency" stroke="#11801c" strokeWidth={2.5} strokeDasharray="4 4" dot={{ fill: '#11801c', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Toolbar (Search & Filter) */}
      <div className="bg-white rounded-xl border border-[#c3c6d8] p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-grow">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#737687]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Session ID or File Name..."
            className="w-full pl-10 pr-4 h-[40px] rounded-lg border border-[#c3c6d8] bg-white focus:border-[#004ccd] focus:ring-1 focus:ring-[#004ccd] text-[14px] outline-none text-[#191c1f]"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative min-w-[140px]">
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-[40px] pl-3 pr-8 rounded-lg border border-[#c3c6d8] bg-white focus:border-[#004ccd] appearance-none text-[14px] outline-none cursor-pointer text-[#191c1f]"
            >
              <option value="All Risks">All Risks</option>
              <option value="High Risk">High Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="Low Risk">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-xl border border-[#c3c6d8] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#c3c6d8] bg-[#f2f4f8]">
                <th className="py-3.5 px-4 text-[12px] text-[#424656] font-bold uppercase tracking-wider">
                  Session ID
                </th>
                <th className="py-3.5 px-4 text-[12px] text-[#424656] font-bold uppercase tracking-wider">
                  File Name
                </th>
                <th className="py-3.5 px-4 text-[12px] text-[#424656] font-bold uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3.5 px-4 text-[12px] text-[#424656] font-bold uppercase tracking-wider">
                  Health Score
                </th>
                <th className="py-3.5 px-4 text-[12px] text-[#424656] font-bold uppercase tracking-wider">
                  Risk Category
                </th>
                <th className="py-3.5 px-4 text-[12px] text-[#424656] font-bold uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="py-3.5 px-4 text-[12px] text-[#424656] font-bold uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#191c1f] divide-y divide-[#c3c6d8]">
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#737687] font-semibold">
                    No sessions found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((session) => {
                  const healthScore = session.risk_data?.overall_health_score ?? 0;
                  const efficiency = session.risk_data?.biomechanical_efficiency_score ?? 0;
                  const cat = session.risk_data?.risk_category || 'Low Risk';

                  return (
                    <tr
                      key={session.session_id}
                      className="hover:bg-[#faf8ff] transition-colors relative group"
                    >
                      <td className="py-4 px-4 font-mono text-[13px] text-[#424656]">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#004ccd] opacity-0 group-hover:opacity-100 transition-opacity" />
                        {session.session_id.substring(0, 8)}
                      </td>
                      <td className="py-4 px-4 font-bold flex items-center gap-2">
                        <Video className="text-[#737687] w-4.5 h-4.5" />
                        <span className="truncate max-w-[200px] block" title={session.video_name}>
                          {session.video_name}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#424656] text-xs">
                        {session.created_at ? new Date(session.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{healthScore}</span>
                          <div className="w-16 h-1.5 bg-[#f2f4f8] rounded-full overflow-hidden border border-[#c3c6d8]">
                            <div
                              className={`h-full rounded-full ${
                                healthScore > 80
                                  ? 'bg-[#11801c]'
                                  : healthScore > 50
                                  ? 'bg-[#004ccd]'
                                  : 'bg-[#ba1a1a]'
                              }`}
                              style={{ width: `${healthScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            cat === 'High Risk'
                              ? 'bg-[#ffdad6] text-[#93000a] border border-[#ffb4ab]'
                              : cat === 'Medium Risk' || cat === 'Moderate Risk'
                              ? 'bg-[#ffe4c2] text-[#b35900] border border-[#ffe0b2]'
                              : 'bg-[#c4f2c7] text-[#11801c] border border-[#ceebd4]'
                          }`}
                        >
                          {cat}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#424656] font-semibold">
                        {efficiency}%
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenSession(session.session_id)}
                            className="p-1.5 text-[#004ccd] hover:bg-[#004ccd]/10 rounded-lg transition-colors"
                            title="View Full Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteSession(session.session_id)}
                            className="p-1.5 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded-lg transition-colors"
                            title="Delete Session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#c3c6d8] flex items-center justify-between text-[13px] text-[#424656] bg-[#faf8ff]">
          <div>
            Showing {filteredSessions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredSessions.length)} of {filteredSessions.length}{' '}
            sessions
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-[#f2f4f8] disabled:opacity-40 text-[#737687]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-[13px] ${
                  currentPage === p
                    ? 'bg-[#004ccd] text-white'
                    : 'hover:bg-[#f2f4f8] text-[#191c1f]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-[#f2f4f8] disabled:opacity-40 text-[#191c1f]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
