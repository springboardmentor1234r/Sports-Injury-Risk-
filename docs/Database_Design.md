# Database Design

## 1. Introduction

The AI Sports Injury Risk Detection Platform uses PostgreSQL as its primary relational database to store user information, athlete profiles, injury history, training details, and future AI analysis results.

A relational database was selected because it provides strong data consistency, supports relationships between entities, and is well suited for structured application data.

---

# 2. Database Objectives

The database is designed to:

- Store user information securely.
- Manage athlete profiles.
- Maintain injury history.
- Store training information.
- Support authentication and authorization.
- Support future AI modules such as video analysis and injury prediction.

---

# 3. Database Management System

| Property | Value |
|----------|-------|
| Database | PostgreSQL |
| Type | Relational Database |
| ORM | SQLAlchemy |
| Backend | FastAPI |

---

# 4. Database Tables

The project consists of the following tables.

## 4.1 Users

Purpose:

Stores login credentials and user information.

Attributes:

- user_id
- full_name
- email
- password
- role
- created_at

---

## 4.2 Athletes

Purpose:

Stores athlete profile information.

Attributes:

- athlete_id
- user_id
- sport
- position
- age
- gender
- height
- weight
- training_load

---

## 4.3 Injury History

Purpose:

Stores previous injuries.

Attributes:

- injury_id
- athlete_id
- injury_name
- injury_date
- recovery_status
- notes

---

## 4.4 Training Profile

Purpose:

Stores athlete training information.

Attributes:

- training_id
- athlete_id
- training_hours
- training_type
- coach_name

---

## 4.5 Videos (Future Module)

Purpose:

Stores uploaded sports videos.

Attributes:

- video_id
- athlete_id
- file_name
- upload_date
- status

---

## 4.6 Risk Assessment (Future Module)

Purpose:

Stores AI prediction results.

Attributes:

- assessment_id
- athlete_id
- risk_score
- injury_type
- prediction_date

---

# 5. Relationships

The database contains the following relationships.

Users

↓

Athletes

↓

Injury History

↓

Training Profile

↓

Risk Assessment

Each athlete belongs to one user.

Each athlete can have multiple injuries.

Each athlete can have multiple training records.

Each athlete can have multiple AI assessments.

---

# 6. Primary Keys

| Table | Primary Key |
|--------|-------------|
| Users | user_id |
| Athletes | athlete_id |
| Injury History | injury_id |
| Training Profile | training_id |
| Videos | video_id |
| Risk Assessment | assessment_id |

---

# 7. Foreign Keys

| Table | Foreign Key | References |
|--------|-------------|------------|
| Athletes | user_id | Users |
| Injury History | athlete_id | Athletes |
| Training Profile | athlete_id | Athletes |
| Videos | athlete_id | Athletes |
| Risk Assessment | athlete_id | Athletes |

---

# 8. Normalization

The database follows Third Normal Form (3NF).

Benefits:

- Reduces redundancy.
- Improves consistency.
- Prevents duplicate information.
- Simplifies maintenance.

---

# 9. Future Expansion

The database is designed so that future modules can be added without changing the existing structure.

Future tables may include:

- Pose Estimation Results
- Joint Angles
- Biomechanical Metrics
- Notifications
- Reports
- Corrective Recommendations

---

# 10. Conclusion

The database design provides a scalable and structured foundation for the AI Sports Injury Risk Detection Platform. It supports current requirements such as authentication and athlete management while remaining flexible enough to integrate AI-powered injury prediction modules in future milestones.