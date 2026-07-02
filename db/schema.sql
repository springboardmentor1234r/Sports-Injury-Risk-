-- ============================================================
-- Sports Injury Risk Detection from Video
-- Database Schema — Milestone 1
-- Database: PostgreSQL
-- ============================================================

-- ---------- ENUM TYPES ----------
CREATE TYPE user_role AS ENUM (
    'athlete',
    'coach',
    'physiotherapist',
    'sports_scientist',
    'admin'
);

-- ---------- USERS ----------
-- Handles login + role-based access for all 5 roles.
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'athlete',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ---------- ATHLETES ----------
-- One-to-one with users (only users with role='athlete' get a row here).
CREATE TABLE athletes (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_type      VARCHAR(100),          -- e.g. Football, Basketball, Athletics
    position        VARCHAR(100),          -- e.g. Striker, Point Guard
    age             INTEGER,
    height_cm       NUMERIC(5,2),
    weight_kg       NUMERIC(5,2),
    injury_history  TEXT,                  -- free text for M1; normalize later if needed
    training_load   VARCHAR(50),           -- e.g. Low / Moderate / High (simple for M1)
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ---------- COACH_ATHLETE (optional, for team/coach dashboard later) ----------
-- Links a coach to the athletes they manage. Useful from M4 onward, safe to add now.
CREATE TABLE coach_athlete (
    id              SERIAL PRIMARY KEY,
    coach_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id      INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    UNIQUE (coach_id, athlete_id)
);

-- ============================================================
-- STUB TABLES — not built in M1, just documented here so the
-- schema is future-proof. Will be implemented in M2/M3.
-- ============================================================

-- CREATE TABLE videos (
--     id              SERIAL PRIMARY KEY,
--     athlete_id      INTEGER REFERENCES athletes(id),
--     file_url        VARCHAR(255),
--     activity_type   VARCHAR(50),   -- running, jumping, landing, etc.
--     uploaded_at     TIMESTAMP DEFAULT NOW()
-- );

-- CREATE TABLE assessments (
--     id                  SERIAL PRIMARY KEY,
--     video_id            INTEGER REFERENCES videos(id),
--     risk_score          NUMERIC(5,2),
--     risk_category       VARCHAR(20),   -- Low / Moderate / High / Critical
--     injury_type         VARCHAR(50),   -- ACL, Hamstring, Ankle, etc.
--     recommendations     TEXT,
--     created_at          TIMESTAMP DEFAULT NOW()
-- );