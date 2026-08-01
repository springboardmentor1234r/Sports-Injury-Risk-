export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export const ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  PHYSIO: 'physiotherapist',
  SCIENTIST: 'sport_scientist',
  ATHLETE: 'athlete'
};
