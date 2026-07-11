-- Just CREATE TABLE statements, no data needed

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'athlete',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE athletes (
  athlete_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sport VARCHAR(100),
  position VARCHAR(100),
  age INTEGER,
  height FLOAT,
  weight FLOAT,
  injury_history TEXT,
  training_load VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);