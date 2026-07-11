# Sports Injury Risk Detection Platform

## Milestone 1 — Project Initialization & Core Setup

### Objective
AI-powered platform to detect sports injury risks from athlete movement videos.

### Tech Stack
- Frontend: React.js + React Router
- Backend: FastAPI (Python)
- Database: PostgreSQL
- Authentication: JWT

### APIs Implemented
- POST /auth/register — User registration
- POST /auth/login — Login with JWT
- GET /athlete/profile — Get athlete profile
- POST /athlete/profile — Create athlete profile
- PUT /athlete/profile — Update athlete profile

### Roles Supported
Athlete, Coach, Physiotherapist, Sports Scientist, Admin

### Datasets Identified
- Human3.6M — Pose estimation
- MPII — Body keypoint detection
- COCO Keypoints — Pose training
- SportsPose — Sports movement analysis
- FIFA Injury Dataset — Risk factor modeling

### How to Run
Backend: `uvicorn main:app --reload` (inside /backend)
Frontend: `npm run dev` (inside /frontend)

### Milestone 2 (Next)
Pose estimation with MediaPipe, biomechanical analysis