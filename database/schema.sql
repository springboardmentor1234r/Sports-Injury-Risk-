-- Sports Injury Risk Detection - PostgreSQL Schema

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR CHECK (role IN ('ADMIN', 'COACH', 'ATHLETE', 'MEDICAL_STAFF')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url VARCHAR,
    phone VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE athletes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    height_cm DECIMAL,
    weight_kg DECIMAL,
    gender VARCHAR,
    sport VARCHAR,
    playing_position VARCHAR,
    training_load_hours DECIMAL,
    dominant_side VARCHAR,
    experience_years INT,
    team VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_history (
    id SERIAL PRIMARY KEY,
    athlete_id INT REFERENCES athletes(id) ON DELETE CASCADE,
    condition_type VARCHAR,
    description TEXT,
    injury_date DATE,
    recovery_date DATE,
    severity VARCHAR,
    body_part VARCHAR,
    treatment TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    athlete_id INT REFERENCES athletes(id) ON DELETE CASCADE,
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR,
    description TEXT,
    file_path VARCHAR,
    s3_key VARCHAR,
    format VARCHAR,
    duration_seconds DECIMAL,
    fps DECIMAL,
    resolution_width INT,
    resolution_height INT,
    file_size_bytes BIGINT,
    status VARCHAR DEFAULT 'PENDING',
    sport_activity VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE video_analyses (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES videos(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'PENDING',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_time_seconds DECIMAL,
    total_frames INT,
    processed_frames INT,
    model_version VARCHAR,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE biomechanical_results (
    id SERIAL PRIMARY KEY,
    analysis_id INT REFERENCES video_analyses(id) ON DELETE CASCADE,
    frame_number INT,
    hip_angle_left DECIMAL,
    hip_angle_right DECIMAL,
    knee_angle_left DECIMAL,
    knee_angle_right DECIMAL,
    shoulder_angle_left DECIMAL,
    shoulder_angle_right DECIMAL,
    ankle_angle_left DECIMAL,
    ankle_angle_right DECIMAL,
    elbow_angle_left DECIMAL,
    elbow_angle_right DECIMAL,
    center_of_mass_x DECIMAL,
    center_of_mass_y DECIMAL,
    stride_length DECIMAL,
    step_width DECIMAL,
    cadence DECIMAL,
    velocity DECIMAL,
    acceleration DECIMAL,
    symmetry_index DECIMAL,
    knee_valgus_angle DECIMAL,
    trunk_lean_angle DECIMAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE injury_predictions (
    id SERIAL PRIMARY KEY,
    analysis_id INT REFERENCES video_analyses(id) ON DELETE CASCADE,
    risk_level VARCHAR CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_score DECIMAL,
    body_region VARCHAR,
    injury_type VARCHAR,
    confidence DECIMAL,
    contributing_factors JSONB,
    shap_values JSONB,
    model_used VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    prediction_id INT REFERENCES injury_predictions(id) ON DELETE CASCADE,
    category VARCHAR,
    exercise_name VARCHAR,
    description TEXT,
    sets INT,
    reps INT,
    duration_minutes INT,
    frequency VARCHAR,
    priority VARCHAR,
    video_url VARCHAR,
    image_url VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR,
    title VARCHAR,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR,
    action_url VARCHAR,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    analysis_id INT REFERENCES video_analyses(id) ON DELETE CASCADE,
    generated_by INT REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR,
    format VARCHAR,
    file_path VARCHAR,
    title VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE performance_records (
    id SERIAL PRIMARY KEY,
    athlete_id INT REFERENCES athletes(id) ON DELETE CASCADE,
    record_date DATE,
    metric_name VARCHAR,
    metric_value DECIMAL,
    unit VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_reports (
    id SERIAL PRIMARY KEY,
    athlete_id INT REFERENCES athletes(id) ON DELETE CASCADE,
    assessed_by INT REFERENCES users(id) ON DELETE SET NULL,
    assessment_date DATE,
    overall_risk VARCHAR,
    summary TEXT,
    detailed_findings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_athletes_user_id ON athletes(user_id);
CREATE INDEX idx_medical_history_athlete_id ON medical_history(athlete_id);
CREATE INDEX idx_videos_athlete_id ON videos(athlete_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_video_analyses_video_id ON video_analyses(video_id);
CREATE INDEX idx_biomechanical_results_analysis_id ON biomechanical_results(analysis_id);
CREATE INDEX idx_injury_predictions_analysis_id ON injury_predictions(analysis_id);
CREATE INDEX idx_injury_predictions_risk_level ON injury_predictions(risk_level);
CREATE INDEX idx_recommendations_prediction_id ON recommendations(prediction_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_created_at ON videos(created_at);
