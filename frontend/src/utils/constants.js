const DEFAULT_API_URL = 'http://localhost:8000/api/v1';
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export function normalizeApiBaseUrl(baseUrl = DEFAULT_API_URL) {
  if (!baseUrl) return DEFAULT_API_URL;

  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_API_URL;

  if (/\/api\/v1$/i.test(trimmed)) {
    return trimmed;
  }

  if (/\/api$/i.test(trimmed)) {
    return `${trimmed}/v1`;
  }

  return `${trimmed}/api/v1`;
}

export const API_URL = normalizeApiBaseUrl(env.VITE_API_URL || DEFAULT_API_URL);
export const WS_URL = env.VITE_WS_URL || 'ws://localhost:8000/ws';

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
