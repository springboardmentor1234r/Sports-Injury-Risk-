import React from 'react';
import { Activity, Dumbbell, Flame, Compass } from 'lucide-react';

const ACTIVITIES = [
  { name: 'Running', icon: Flame },
  { name: 'Sprinting', icon: Flame },
  { name: 'Jumping', icon: Activity },
  { name: 'Landing', icon: Activity },
  { name: 'Squatting', icon: Dumbbell },
  { name: 'Throwing', icon: Dumbbell },
  { name: 'Cutting', icon: Compass },
  { name: 'Walking', icon: Compass },
  { name: 'Custom Activity', icon: Compass }
];

export const ActivitySelector = ({ selected, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Select Athletic Activity
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {ACTIVITIES.map((act) => {
          const Icon = act.icon;
          const isSelected = selected === act.name;
          return (
            <button
              key={act.name}
              type="button"
              onClick={() => onChange(act.name)}
              className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-hud-blue/15 border-hud-blue text-hud-blue shadow-lg shadow-hud-blue-glow'
                  : 'bg-hud-dark border-hud-border text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-hud-blue' : 'text-gray-500'}`} />
              <span className="text-xs font-semibold">{act.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActivitySelector;
