// Centralized backend base URL.
//
// Every page used to hardcode "http://localhost:8000" directly, which
// works for local dev but breaks the moment the frontend is deployed
// anywhere else (Milestone 4 — Docker/cloud deployment). Set
// VITE_API_BASE in the environment (see .env.example / docker-compose.yml)
// to point at the real backend URL in staging/production; local dev keeps
// working unchanged since the fallback is the same localhost:8000 every
// page already used.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
