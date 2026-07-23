# KineticGuard - Sports Injury Risk Detection

KineticGuard is a premium, modern SaaS platform designed for high-performance athletic biomechanics telemetry, injury risk monitoring, and athlete profile management. It provides role-based access for Coaches, Physiotherapists, Sports Scientists, Athletes, and Admins.

---

## 🚀 Features Implemented

### ✅ Milestone 1 — Authentication, RBAC & Athlete Registry

#### 1. Robust Authentication & Security
* **JWT Authorization:** Automated Bearer token authentication and interceptor layers.
* **Role-Based Access Control (RBAC):** Customized dashboards, actions, and table headers depending on the user role:
  * **Athlete:** Personal biometric card, self-registration, and self-profile editing.
  * **Coach:** Full registry visibility with performance stats, creation, and updating of athlete files.
  * **Physiotherapist:** Clinical registry views showing injury logs and medical notes.
  * **Sports Scientist:** Registry tables tracking training load index and fitness indicators.
  * **Admin:** Full read/write/edit/delete authority across all athlete files.

#### 2. User Experience & Aesthetics
* **Theme Switching:** Premium Light and Dark theme selections with persistent user caching.
* **Modern SaaS Layout:** Clean typography (Outfit font) and responsive frosted glass card panels.
* **Data Shimmer Skeletons:** Skeleton placeholders shown during API fetches to prevent layout shifts.

---

### ✅ Milestone 2 — Pose Estimation & Biomechanical Analysis

Milestone 2 implements a full computer-vision analysis pipeline that processes athlete videos through four automated stages:

    [Video Upload] -> [Pose Estimation] -> [Skeleton Tracking] -> [Biomechanical Analysis]

#### 1. Video Upload & Management
* **Role-Aware Upload:** Athletes can only upload videos for themselves; Coaches and Admins can upload for any athlete.
* **Secure File Validation:** Extension whitelist (.mp4, .avi, .mov, .webm), 100MB max size, chunked streaming upload.
* **OpenCV Integrity Check:** Extracts FPS, resolution, duration, and frame count. Validates the video is not corrupted.
* **UUID-Named Storage:** Videos stored with UUID filenames in backend/uploads/ to prevent naming collisions.
* **Drag-and-Drop UI:** Modern upload interface with real-time progress bar and recent uploads grid.

#### 2. Pose Estimation (MediaPipe - 33 Landmarks)
* **Google MediaPipe Pose AI** runs frame-by-frame on every uploaded video, detecting 33 body keypoints per frame.
* Landmark data includes normalized x, y, z coordinates and visibility (AI confidence score 0.0-1.0) for each joint.
* Processed in a **FastAPI background task** — upload API returns immediately while AI runs asynchronously.
* Results stored per-frame in MongoDB PoseAnalysis collection.

Keypoints tracked:
NOSE, LEFT/RIGHT: EYE, EAR, SHOULDER, ELBOW, WRIST, PINKY, INDEX, THUMB, HIP, KNEE, ANKLE, HEEL, FOOT_INDEX

#### 3. Skeleton Tracking
* **Bone Connection Mapping:** 14 joint-pair connections rendered as colored lines (collar bone, arms, spine, legs).
* **Velocity Calculation:** velocity = Euclidean 3D distance / delta_t between consecutive frames for every joint.
* **Acceleration Calculation:** acceleration = (v_current - v_previous) / delta_t per joint per frame.
* **Motion Trails:** Sliding window of last 30 positions maintained for wrists and ankles.
* **Real-time Canvas Rendering:** HTML5 Canvas draws video frame underneath and skeleton overlay on top.

#### 4. Biomechanical Analysis

Seven clinical-grade metrics computed per frame using 3D vector mathematics:

| Module | Metric | Description |
|--------|--------|-------------|
| Joint Angles | Knee Flexion L/R | 3D angle at knee (Hip->Knee->Ankle) |
| Joint Angles | Knee Valgus L/R | Deviation from straight line (180 deg - angle) |
| Joint Angles | Hip Flexion L/R | 3D angle at hip (Shoulder->Hip->Knee) |
| Range of Motion | Progressive ROM | Min/max angle range tracked across all frames |
| Balance Analysis | CoM Offset | Horizontal center-of-mass deviation from midline |
| Posture Analysis | Trunk Lean | Forward/backward tilt angle of shoulder-hip vector |
| Limb Symmetry | Symmetry Index | Left vs right angle difference as percentage |
| Landing Mechanics | Landing Flexion | Knee flexion angle at ground-contact frame (ACL risk) |
| Stride Analysis | Stride Length | Peak horizontal ankle separation distance |

#### 5. Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Video Upload | /milestone2/upload | Drag-and-drop upload with progress bar and recent uploads grid |
| Pose Analysis | /milestone2/pose | Live video canvas with 33 joint dots and bone lines overlay |
| Skeleton Tracking | /milestone2/skeleton | Velocity labels, motion trails, velocity graph per joint |
| Biomechanics | /milestone2/biomechanics | Clinical dashboard with angle cards, heatmap, and summary metrics |

#### 6. Backend APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /milestone2/videos/upload | Upload video with athlete assignment |
| GET | /milestone2/videos | List videos filtered by role |
| DELETE | /milestone2/videos/{id} | Delete video and associated analysis data |
| POST | /milestone2/pose/process/{video_id} | Trigger MediaPipe pose estimation |
| GET | /milestone2/pose/video/{video_id} | Fetch pose session for a video |
| GET | /milestone2/pose/status/{analysis_id} | Poll pose processing progress |
| GET | /milestone2/pose/results/{analysis_id} | Retrieve completed pose frame data |
| POST | /milestone2/analysis/start/{video_id} | Start skeleton tracking + biomechanics pipeline |
| GET | /milestone2/analysis/status/{session_id} | Poll full analysis pipeline status |
| GET | /milestone2/analysis/skeleton/{video_id} | Get skeleton tracking results |
| GET | /milestone2/analysis/biomechanics/{video_id} | Get biomechanics analysis results |
| GET | /milestone2/analysis/status-by-video/{video_id} | Get session status by video ID |

#### 7. MongoDB Collections

| Collection | Stores |
|------------|--------|
| Videos | Video metadata: filename, FPS, resolution, duration, athlete ID, status |
| AnalysisSessions | Parent session document linking all 3 analysis IDs + overall status |
| PoseAnalysis | 33 landmarks x every frame (x, y, z, visibility per joint) |
| SkeletonTracking | Bone connections, joint velocities, accelerations, motion trails per frame |
| Biomechanics | Joint angles, ROM, balance offset, symmetry, landing angle per frame + session summary |

#### 8. Project Workflow / Pipeline

    1. UPLOAD  -> Athlete/Coach uploads video via drag-and-drop UI
                  File saved with UUID name | OpenCV extracts metadata
                  MongoDB: Videos + AnalysisSessions + PoseAnalysis (placeholder) created

    2. POSE    -> MediaPipe Pose AI processes every video frame (background task)
                  33 keypoints detected per frame with x, y, z, visibility
                  Stored to MongoDB: PoseAnalysis collection

    3. SKELETON-> Physics calculations derived from pose coordinates
                  14 bone connections mapped | Velocity & acceleration computed
                  Motion trails tracked (30-frame sliding window)
                  Stored to MongoDB: SkeletonTracking collection

    4. BIOMECH -> 7 biomechanical metrics computed per frame using 3D math
                  Knee/hip angles, ROM, balance, posture, symmetry, stride, landing
                  Session summary statistics generated (peak values)
                  Stored to MongoDB: Biomechanics collection

    5. FRONTEND-> React polls status via interval until pipeline completes
                  PoseAnalysis: canvas renders joints/bones over video
                  SkeletonTracking: canvas adds velocity labels & motion trails
                  Biomechanics: dashboard shows clinical metrics & heatmap

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite), Vanilla CSS, Lucide Icons, Recharts |
| Backend | FastAPI (Python 3.13), Uvicorn, BCrypt, PyJWT |
| AI / CV | MediaPipe Pose, OpenCV (cv2), NumPy |
| Database | MongoDB (Motor async driver) |

---

## 📁 Project Structure

    sports-injury-risk/
    ├── backend/                        # FastAPI Python backend
    │   └── app/
    │       ├── main.py                 # Application entrypoint & CORS middleware
    │       ├── database.py             # MongoDB client configuration
    │       ├── utils/auth.py           # BCrypt utilities & JWT signing
    │       ├── models/athlete.py       # Milestone 1 MongoDB models
    │       ├── schemas/                # Pydantic validation schemas (Milestone 1)
    │       ├── routers/                # Milestone 1 API route controllers
    │       └── milestone2/             # Milestone 2 — Video Analysis Engine
    │           ├── models/             # MongoDB document schemas
    │           │   ├── video.py
    │           │   ├── pose.py
    │           │   ├── skeleton.py
    │           │   └── biomechanics.py
    │           ├── schemas/            # Pydantic request/response schemas
    │           ├── routers/            # REST API endpoint controllers
    │           │   ├── video.py        # Upload, list, delete videos
    │           │   ├── pose.py         # Pose estimation endpoints
    │           │   └── analysis.py     # Skeleton + biomechanics endpoints
    │           └── services/           # Business logic & AI services
    │               ├── video_service.py
    │               ├── pose_service.py       # MediaPipe AI pose engine
    │               ├── skeleton_tracking.py  # Velocity & motion trail engine
    │               ├── analysis_service.py   # Full pipeline orchestrator
    │               └── analysis/
    │                   ├── joint_angles.py
    │                   ├── range_of_motion.py
    │                   ├── balance.py
    │                   ├── posture.py
    │                   ├── symmetry.py
    │                   ├── landing.py
    │                   └── stride.py
    ├── frontend/                       # Vite React.js frontend
    │   ├── src/
    │   │   ├── App.jsx                 # Routing & lazy-loaded pages
    │   │   ├── index.css               # Theme styles & design tokens
    │   │   ├── utils/api.js            # Axios client interceptor
    │   │   ├── components/             # Shared UI component library
    │   │   ├── pages/                  # Milestone 1 page controllers
    │   │   └── milestone2/             # Milestone 2 frontend modules
    │   │       ├── pages/
    │   │       │   ├── VideoUpload.jsx
    │   │       │   ├── PoseAnalysis.jsx
    │   │       │   ├── SkeletonTracking.jsx
    │   │       │   └── Biomechanics.jsx
    │   │       └── components/
    │   │           ├── PoseCanvas.jsx
    │   │           ├── SkeletonViewer.jsx
    │   │           ├── LandmarkTable.jsx
    │   │           ├── JointAngleCard.jsx
    │   │           ├── AngleHeatmap.jsx
    │   │           ├── MetricsDashboard.jsx
    │   │           ├── PoseTimeline.jsx
    │   │           ├── FrameNavigator.jsx
    │   │           ├── ConfidenceIndicator.jsx
    │   │           ├── VelocityGraph.jsx
    │   │           ├── VideoUploader.jsx
    │   │           ├── UploadProgress.jsx
    │   │           ├── VideoPreview.jsx
    │   │           └── RecentUploads.jsx
    │   └── public/                     # Static media & assets
    └── milestone_1/                    # Milestone 1 documentation summary

---

## 🔧 Setup & Installation

### Prerequisite Services
* Ensure a local MongoDB server is running on mongodb://localhost:27017
* Python 3.10+ and Node.js 18+ installed.

### 1. Backend Setup
1. Navigate to the backend folder:
   cd backend

2. Initialize virtual environment and install packages:
   python -m venv venv
   venv\Scripts\activate         (Windows)
   source venv/bin/activate        (macOS/Linux)
   pip install -r requirements.txt

3. Boot backend listener:
   uvicorn app.main:app --host 127.0.0.1 --port 8000

4. Interactive API docs available at: http://127.0.0.1:8000/docs

Note: MediaPipe and OpenCV are included in requirements.txt. No separate installation is required.

### 2. Frontend Setup
1. Navigate to the frontend folder:
   cd frontend

2. Install npm packages:
   npm install

3. Launch development server:
   npm run dev

4. Application available at: http://localhost:5173

### 3. Quick Run Script
Alternatively, run the root-level script from the parent folder to start both services concurrently:
* Windows Command Prompt / PowerShell: run.bat

---

## 🌐 Application Routes

| Route | Page | Milestone |
|-------|------|-----------|
| /login | Login | 1 |
| /register | Registration | 1 |
| /dashboard | Role-based Dashboard | 1 |
| /milestone2/upload | Video Upload | 2 |
| /milestone2/pose | Pose Analysis | 2 |
| /milestone2/skeleton | Skeleton Tracking | 2 |
| /milestone2/biomechanics | Biomechanics Dashboard | 2 |
