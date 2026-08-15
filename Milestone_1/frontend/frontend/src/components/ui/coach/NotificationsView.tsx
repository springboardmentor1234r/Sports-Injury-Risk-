import React, { useState } from 'react';
import { 
  UserPlus, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationsViewProps {
  invites: any[];
  alerts: any[];
  onApproveInvite: (id: any) => void;
  onDeclineInvite: (id: any) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  invites,
  alerts,
  onApproveInvite,
  onDeclineInvite
}) => {
  // Display real invites and alerts strictly from backend
  const invitesToDisplay = invites;
  const alertsToDisplay = alerts;

  const pendingInvites = invitesToDisplay.filter(i => i.status === 'pending' || i.status === undefined);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#191c1f]">
          Notifications
        </h2>
        <p className="text-sm md:text-base text-[#424656] mt-1">
          Manage connection requests and review recent system alerts.
        </p>
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Connection Invites */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-[#191c1f] flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#004ccd]" />
            Connection Invites
            {pendingInvites.length > 0 && (
              <span className="bg-[#f3f3ff] text-[#0f62fe] font-bold text-xs px-2.5 py-0.5 rounded-full ml-1">
                {pendingInvites.length}
              </span>
            )}
          </h3>

          <div className="space-y-4">
            {pendingInvites.map((invite) => {
              const name = invite.athleteName || invite.athlete_name || 'Athlete';
              const team = invite.teamName || invite.athlete_email || 'Team Group';

              return (
                <div
                  key={invite.id}
                  className="bg-white rounded-xl p-4 border border-[#c3c6d8] shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3.5">
                    {invite.athlete_picture_url || invite.avatarUrl ? (
                      <img
                        src={invite.athlete_picture_url || invite.avatarUrl}
                        alt={name}
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#c3c6d8]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#dce3eb] text-[#5e656c] font-bold text-sm flex items-center justify-center shrink-0">
                        {invite.initials || name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#191c1f] truncate">
                        {name}
                      </h4>
                      <p className="text-xs text-[#424656] mb-3 truncate">
                        {team}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onApproveInvite(invite.id)}
                          className="flex-1 bg-[#004ccd] text-white font-semibold text-xs py-2 rounded-lg hover:bg-[#003da9] transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => onDeclineInvite(invite.id)}
                          className="flex-1 bg-[#f2f4f8] border border-[#c3c6d8] text-[#191c1f] font-semibold text-xs py-2 rounded-lg hover:bg-[#e0e2e6] transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {pendingInvites.length === 0 && (
              <div className="bg-white rounded-xl border border-[#c3c6d8] p-8 text-center text-xs text-[#737687]">
                No pending connection invites.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: System Log & Alerts */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-[#191c1f] flex items-center gap-2">
            <History className="w-5 h-5 text-[#585f66]" />
            System Log & Alerts
          </h3>

          <div className="bg-white rounded-xl border border-[#c3c6d8] shadow-xs overflow-hidden">
            <div className="divide-y divide-[#c3c6d8]/40">
              {alertsToDisplay.map((alert) => {
                const isError = alert.type === 'error' || alert.type === 'warning';
                const isSuccess = alert.type === 'success';

                return (
                  <div
                    key={alert.id}
                    className="p-4 hover:bg-[#f2f4f8] transition-colors flex items-start gap-4 relative overflow-hidden group"
                  >
                    {isError && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ba1a1a]" />
                    )}

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isError
                          ? 'bg-[#ffdad6] text-[#ba1a1a]'
                          : isSuccess
                          ? 'bg-[#dbe1ff] text-[#004ccd]'
                          : 'bg-[#e0e2e6] text-[#424656]'
                      }`}
                    >
                      {isError && <AlertTriangle className="w-4 h-4" />}
                      {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                      {!isError && !isSuccess && <Info className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-semibold text-[#191c1f]">
                          {alert.title || alert.message || 'Notification'}
                        </h4>
                        <span className="text-[11px] text-[#424656]">
                          {alert.timestamp || alert.created_at || 'Just now'}
                        </span>
                      </div>
                      <p className="text-xs text-[#424656] leading-relaxed">
                        {alert.description || alert.message || ''}
                      </p>
                    </div>
                  </div>
                );
              })}

              {alertsToDisplay.length === 0 && (
                <div className="p-8 text-center text-xs text-[#737687]">
                  No system alerts recorded.
                </div>
              )}
            </div>

            <div className="bg-[#f2f4f8] p-3 text-center border-t border-[#c3c6d8]">
              <button 
                onClick={() => toast.success("All logs up to date.")}
                className="text-xs font-semibold text-[#004ccd] hover:underline"
              >
                View All Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
