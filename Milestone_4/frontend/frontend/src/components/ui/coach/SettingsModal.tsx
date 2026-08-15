import React, { useState } from 'react';
import { X, Settings, Bell, Shield, Sliders, Check } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  coachName?: string;
  coachRole?: string;
  avatarUrl?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  coachName = "Coach",
  coachRole = "MoveIQ Coach",
  avatarUrl
}) => {
  const [highRiskThreshold, setHighRiskThreshold] = useState(75);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-[#c3c6d8] dark:border-slate-800 overflow-hidden space-y-6">
        <div className="p-6 border-b border-[#c3c6d8] dark:border-slate-800 flex justify-between items-center bg-[#f7f9fd] dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[#004ccd] dark:text-blue-400" />
            <h3 className="text-lg font-bold text-[#191c1f] dark:text-white">Coach Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#424656] dark:text-slate-400 hover:bg-[#e0e2e6] dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {saved && (
            <div className="p-3 bg-[#c4f2c7] dark:bg-green-900/30 text-[#0f5132] dark:text-green-400 rounded-lg text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> Preferences updated.
            </div>
          )}

          {/* Coach Identity */}
          <div className="flex items-center gap-3 p-3 bg-[#f2f4f8] dark:bg-slate-800/50 rounded-xl">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={coachName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-[#c3c6d8] dark:border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#004ccd] text-white flex items-center justify-center font-bold text-sm">
                {coachName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-[#191c1f] dark:text-white">{coachName}</p>
              <p className="text-xs text-[#424656] dark:text-slate-400">{coachRole}</p>
            </div>
          </div>

          {/* Thresholds */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#191c1f] dark:text-slate-200 flex justify-between">
              <span>High Risk Strain Threshold</span>
              <span className="text-[#004ccd] dark:text-blue-400 font-bold">{highRiskThreshold}%</span>
            </label>
            <input
              type="range"
              min={50}
              max={95}
              value={highRiskThreshold}
              onChange={(e) => setHighRiskThreshold(Number(e.target.value))}
              className="w-full accent-[#004ccd]"
            />
            <p className="text-[11px] text-[#424656] dark:text-slate-400">
              Athletes exceeding this strain load will trigger immediate High Risk alerts.
            </p>
          </div>

          {/* Unit Preferences */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#191c1f] dark:text-slate-200">Unit System</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnits('metric')}
                className={`py-2 rounded-lg text-xs font-semibold border ${units === 'metric'
                    ? 'bg-[#004ccd] text-white border-transparent'
                    : 'bg-white dark:bg-slate-800 text-[#191c1f] dark:text-slate-300 border-[#c3c6d8] dark:border-slate-700'
                  }`}
              >
                Metric (cm / kg)
              </button>
              <button
                type="button"
                onClick={() => setUnits('imperial')}
                className={`py-2 rounded-lg text-xs font-semibold border ${units === 'imperial'
                    ? 'bg-[#004ccd] text-white border-transparent'
                    : 'bg-white dark:bg-slate-800 text-[#191c1f] dark:text-slate-300 border-[#c3c6d8] dark:border-slate-700'
                  }`}
              >
                Imperial (in / lbs)
              </button>
            </div>
          </div>

          {/* Email Alerts Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-bold text-[#191c1f] dark:text-slate-200">High Risk Push Alerts</p>
              <p className="text-[11px] text-[#424656] dark:text-slate-400">Receive immediate notifications</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#004ccd]"
            />
          </div>

          {/* Save Action */}
          <div className="pt-4 border-t border-[#c3c6d8] dark:border-slate-800 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#424656] dark:text-slate-300 hover:bg-[#e0e2e6] dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-[#004ccd] text-white hover:bg-[#003da9] rounded-lg shadow-xs"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
