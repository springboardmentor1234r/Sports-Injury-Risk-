import React, { useState } from 'react';
import { 
  Users, 
  Folder, 
  Plus, 
  Link as LinkIcon, 
  LayoutGrid, 
  List as ListIcon, 
  Heart, 
  PauseCircle, 
  ArrowRight,
  UserCheck,
  Trash2
} from 'lucide-react';

interface TeamsViewProps {
  teams: any[];
  athletes: any[];
  onCreateTeam: (teamName: string) => void;
  onAssignAthlete: (athleteId: string, teamId: string) => void;
  onDeleteTeam?: (teamId: any) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  teams,
  athletes,
  onCreateTeam,
  onAssignAthlete,
  onDeleteTeam
}) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    onCreateTeam(newTeamName.trim());
    setFeedbackMsg(`Created team "${newTeamName.trim()}"`);
    setNewTeamName('');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId || !selectedTeamId) return;
    const athlete = athletes.find(a => String(a.id) === String(selectedAthleteId));
    const team = teams.find(t => String(t.id) === String(selectedTeamId));

    onAssignAthlete(selectedAthleteId, selectedTeamId);
    setFeedbackMsg(`Assigned ${athlete?.full_name || athlete?.firstName || 'Athlete'} to ${team?.name}`);
    setSelectedAthleteId('');
    setSelectedTeamId('');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Strictly display real teams from backend
  const teamsToDisplay = teams;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#191c1f]">
          Teams Management
        </h2>
        <p className="text-sm md:text-base text-[#424656] mt-1">
          Organize your athletes into functional groups and manage assignments.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-[#c4f2c7] text-[#0f5132] rounded-lg text-xs font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          {feedbackMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Create New Team Card */}
          <div className="bg-white rounded-xl border border-[#c3c6d8] shadow-xs p-6 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#f3f3ff] text-[#004ccd] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#191c1f]">Create New Team</h3>
            </div>
            <p className="text-xs text-[#424656] mb-5">
              Establish a new squad, training group, or rehabilitation cohort.
            </p>
            <form onSubmit={handleCreateTeamSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-[#424656] mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., U18 Elite Squad"
                  className="w-full border border-[#c3c6d8] rounded-lg px-3.5 py-2 text-sm text-[#191c1f] focus:outline-none focus:border-[#004ccd] focus:ring-1 focus:ring-[#004ccd] bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={!newTeamName.trim()}
                className="bg-[#004ccd] hover:bg-[#003da9] disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-1"
              >
                <Plus className="w-4 h-4" />
                Create Team
              </button>
            </form>
          </div>

          {/* Assign Athlete Card */}
          <div className="bg-white rounded-xl border border-[#c3c6d8] shadow-xs p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#f3f3ff] text-[#304db9] flex items-center justify-center">
                <LinkIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#191c1f]">Assign Athlete</h3>
            </div>
            <p className="text-xs text-[#424656] mb-5">
              Quickly link an existing athlete to a designated team.
            </p>
            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-[#424656] mb-1">
                  Select Athlete
                </label>
                <select
                  value={selectedAthleteId}
                  onChange={(e) => setSelectedAthleteId(e.target.value)}
                  className="w-full border border-[#c3c6d8] rounded-lg px-3.5 py-2 text-sm text-[#191c1f] focus:outline-none focus:border-[#004ccd] bg-white"
                >
                  <option value="">Search or select athlete...</option>
                  {athletes.map((ath) => (
                    <option key={ath.id} value={ath.id}>
                      {ath.full_name || `${ath.firstName || ''} ${ath.lastName || ''}`} ({ath.sport || ath.profile?.sport || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#424656] mb-1">
                  Destination Team
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full border border-[#c3c6d8] rounded-lg px-3.5 py-2 text-sm text-[#191c1f] focus:outline-none focus:border-[#004ccd] bg-white"
                >
                  <option value="">Select target team...</option>
                  {teamsToDisplay.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedAthleteId || !selectedTeamId}
                className="border border-[#004ccd] text-[#004ccd] hover:bg-[#004ccd]/5 disabled:opacity-50 font-semibold text-xs py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-1"
              >
                <UserCheck className="w-4 h-4" />
                Assign to Team
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Teams Directory */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-[#191c1f] flex items-center gap-2">
              <Folder className="w-5 h-5 text-[#004ccd]" />
              Teams Directory
            </h3>
            <div className="flex gap-1.5 bg-[#e0e2e6] p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-[#004ccd]' : 'text-[#424656]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-xs text-[#004ccd]' : 'text-[#424656]'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Teams Grid / List */}
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-3"}>
            {teamsToDisplay.map((team) => {
              const isRehab = team.borderColorTheme === 'error' || team.status === 'High Monitoring';
              const topBorderClass = isRehab
                ? 'border-t-4 border-t-[#ba1a1a]'
                : team.borderColorTheme === 'slate' || team.status === 'Off-Season'
                ? 'border-t-4 border-t-[#737687]'
                : 'border-t-4 border-t-[#304db9]';

              const memberCount = team.memberCount ?? (team.athletes ? team.athletes.length : 0);

              return (
                <div
                  key={team.id}
                  className={`bg-white border border-[#c3c6d8] rounded-xl shadow-xs p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full ${topBorderClass}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-base font-bold text-[#191c1f] group-hover:text-[#004ccd]">
                        {team.name}
                      </h4>
                      <span
                        className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isRehab
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : 'bg-[#e6e8ec] text-[#424656]'
                        }`}
                      >
                        {team.status || 'Active Roster'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`font-bold text-sm px-3 py-1 rounded-full flex items-center gap-1 ${
                          isRehab
                            ? 'bg-[#ffdad6]/60 text-[#ba1a1a]'
                            : 'bg-[#dde1ff] text-[#304db9]'
                        }`}
                      >
                        {isRehab ? (
                          <Heart className="w-3.5 h-3.5" />
                        ) : (
                          <Users className="w-3.5 h-3.5" />
                        )}
                        <span>{memberCount}</span>
                      </div>

                      {onDeleteTeam && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTeam(team.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {team.athletes && team.athletes.length > 0 ? (
                    <div className="mt-auto">
                      <p className="text-[11px] font-medium text-[#424656] mb-2 uppercase tracking-wider">
                        Assigned Athletes
                      </p>
                      <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                        {team.athletes.map((ath: any) => (
                          <div key={ath.id} className="flex justify-between items-center text-xs border-b border-[#c3c6d8]/30 pb-1">
                            <span className="text-[#191c1f] font-medium">{ath.full_name || ath.firstName}</span>
                            <span className="text-[#737687] text-[10px]">{ath.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : isRehab ? (
                    <div className="mt-auto">
                      <p className="text-[11px] font-medium text-[#424656] mb-2 uppercase tracking-wider">
                        Members
                      </p>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs border-b border-[#c3c6d8]/30 pb-1.5">
                          <span className="text-[#191c1f] font-medium">J. Doe (ACL)</span>
                          <span className="text-[#ba1a1a] font-semibold text-[11px]">High Risk</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-[#c3c6d8]/30 pb-1.5">
                          <span className="text-[#191c1f] font-medium">S. Williams (Hamstring)</span>
                          <span className="text-[#0052dd] font-semibold text-[11px]">Moderate</span>
                        </div>
                      </div>
                    </div>
                  ) : team.status === 'Off-Season' ? (
                    <div className="mt-auto flex items-center justify-center p-4 bg-[#f2f4f8] border border-dashed border-[#c3c6d8] rounded-lg">
                      <span className="text-[#424656] text-xs flex items-center gap-2">
                        <PauseCircle className="w-4 h-4 text-[#737687]" />
                        Currently Inactive
                      </span>
                    </div>
                  ) : (
                    <div className="mt-auto">
                      <p className="text-[11px] font-medium text-[#424656] mb-2 uppercase tracking-wider">
                        Key Members
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(team.keyMembers || ["M. Johnson (QB)", "T. Brady (WR)"]).map((member: string, i: number) => (
                          <span
                            key={i}
                            className="text-[11px] bg-[#f2f4f8] px-2 py-1 rounded-md text-[#191c1f] border border-[#c3c6d8]/40"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {teamsToDisplay.length === 0 && (
              <div className="col-span-full bg-white rounded-xl border border-[#c3c6d8] p-12 text-center text-xs text-[#737687]">
                No teams created yet. Use &apos;Create New Team&apos; on the left to add one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
