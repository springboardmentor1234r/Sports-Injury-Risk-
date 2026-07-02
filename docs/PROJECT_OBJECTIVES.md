# Sports Injury Risk Detection from Video — Project Objectives

## 1. Problem Statement
Athletes often get injured (ACL tears, hamstring strains, ankle sprains) due to poor
movement mechanics that go unnoticed until it's too late. Coaches and physiotherapists
usually spot these issues only after an injury has already happened.

**Goal:** Build a web platform that analyzes an athlete's movement from video, flags
risky biomechanical patterns (e.g. knee valgus during landing), and recommends
corrective exercises — *before* an injury occurs.

## 2. Core Workflow

```
Athlete uploads video
        │
        ▼
AI detects body joints (pose estimation)
        │
        ▼
System analyzes movement (joint angles, symmetry, posture)
        │
        ▼
Injury risk is predicted (ACL, hamstring, ankle, shoulder, etc.)
        │
        ▼
Risk score generated (Low / Moderate / High / Critical)
        │
        ▼
Corrective exercises + report shown on dashboard
```

## 3. User Roles & Permissions

| Role | Can do |
|---|---|
| Athlete | Register, manage own profile, upload videos, view own risk reports |
| Coach | View team's athletes' risk overview, performance analytics |
| Physiotherapist | View injury risk + rehab tracking, recovery reports |
| Sports Scientist | View biomechanical analytics, research-level data across athletes |
| Administrator | Manage users, monitor system, manage reports |

## 4. Milestone Roadmap

| Milestone | Weeks | Focus |
|---|---|---|
| **M1** | 1–2 | Project setup, auth, athlete profiles, dataset collection |
| M2 | 3–4 | Pose estimation engine (MediaPipe/OpenCV), biomechanical analysis |
| M3 | 5–6 | Injury risk prediction, risk scoring, exercise recommendations |
| M4 | 7–8 | Dashboards, testing, deployment |

## 5. Milestone 1 Scope (this sprint — due July 13)

**In scope:**
- Project repo + environment setup (React frontend, FastAPI backend, PostgreSQL)
- User registration/login with JWT
- Role-based access control (5 roles above)
- Athlete profile CRUD (Athlete ID, Sport Type, Position, Age, Height, Weight,
  Injury History, Training Load)
- Sample pose-estimation dataset identified and documented (full integration is M2)

**Out of scope for M1** (comes later):
- Actual video upload/processing
- Pose estimation / AI inference
- Risk scoring, recommendations, dashboards

## 6. Milestone 1 Success Criteria
- [ ] Project initialization completed (repo, branch, folder structure)
- [ ] Authentication implemented (register/login, JWT, role field)
- [ ] Athlete profile management operational (create/view/update)
- [ ] Pose datasets identified & sample downloaded, documented in repo