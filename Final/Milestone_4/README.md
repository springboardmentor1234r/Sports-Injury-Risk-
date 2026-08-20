# Milestone 4: Final Project Module — Architecture, Models, Database, APIs & Standalone Frontend

This directory houses the final application-level intelligence, reporting, alerts, API router, and standalone user interface layers (Milestone 4).

## Purpose
Milestone 4 consumes outputs from Milestone 3 (Scoring, Anomalies, Predictions, Recommendations) and provides:
1. **Athlete Reports:** Compiled summary records linking metrics and kinematics.
2. **Analysis History:** A logging database to trace athlete progress trends over time.
3. **System Notifications:** Dynamic in-app warning triggers on high/critical risk thresholds.

---

## Folder Structure
```text
milestone4/
├── README.md
├── task.md
│
├── backend/
│   ├── models/
│   │   ├── report.py                   # AthleteReportsDB
│   │   ├── history.py                  # AnalysisHistoryDB
│   │   └── notification.py             # NotificationsDB
│   │
│   ├── schemas/
│   │   ├── report.py
│   │   ├── history.py
│   │   └── notification.py
│   │
│   ├── services/
│   │   ├── report_service.py
│   │   ├── history_service.py
│   │   └── notification_service.py
│   │
│   └── routers/
│       ├── auth_helper.py              # verify_session_permission & verify_athlete_permission
│       ├── reports.py                  # Reports endpoints
│       ├── history.py                  # History endpoints
│       └── notifications.py            # Alert notifications endpoints
│
└── frontend/
    ├── components/
    │   ├── AthleteHealthCard.jsx       # Health score indexes panel
    │   ├── AnomalySummary.jsx          # Technique anomalies detail table
    │   ├── DataLimitations.jsx         # Warning indicator log
    │   ├── InjuryRiskSummary.jsx       # Joint probability block grid
    │   ├── NotificationBadge.jsx       # Unread counter indicators
    │   ├── NotificationCard.jsx        # Alert card rendering actions
    │   ├── NotificationFilters.jsx     # Read/unread status selectors
    │   ├── RecommendationSummary.jsx   # Training/recovery tabbed suggestions
    │   ├── ReportHeader.jsx            # Summary identity tags
    │   ├── RiskSummaryCard.jsx         # Overall risk index visual gauge
    │   └── ReportLoading.jsx           # High-fidelity loader skeleton
    │
    ├── pages/
    │   ├── AthleteReport.jsx           # Main compiled report card layout
    │   ├── AnalysisHistory.jsx         # Time-series trend line plotting curves
    │   └── Notifications.jsx           # System alerts dashboard controller
    │
    ├── services/
    │   └── milestone4Api.js            # Axios request config
    │
    ├── index.html                      # Standalone page template
    ├── index.css                       # System CSS stylesheets & Print overrides
    ├── main.jsx                        # Standalone routing tree coordinator
    └── package.json                    # Independent dev server scripts
```

---

## API Endpoints

| Method | Endpoint | Description | Auth Required | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/milestone4/reports/{session_id}/generate` | Compile and save detailed athlete report | Yes (JWT) | Coach, Admin, Profile Owner |
| **GET** | `/milestone4/reports/{session_id}` | Retrieve compiled athlete report | Yes (JWT) | Coach, Admin, Profile Owner |
| **GET** | `/milestone4/history/{athlete_id}` | Retrieve chronological history summaries | Yes (JWT) | Coach, Admin, Profile Owner |
| **GET** | `/milestone4/notifications/{athlete_id}` | Retrieve active alerts with unread filtering | Yes (JWT) | Coach, Admin, Profile Owner |
| **PATCH** | `/milestone4/notifications/{notification_id}/read` | Mark alert notification as read | Yes (JWT) | Coach, Admin, Profile Owner |
| **POST** | `/milestone4/notifications/{session_id}/evaluate` | Run checks and create alerts for a session | Yes (JWT) | Coach, Admin, Profile Owner |

---

## Standalone Frontend Setup
The Milestone 4 frontend runs as a completely isolated application. It communicates with the backend via Axios and dynamically attaches authorization tokens from storage.

### Development Commands:
```bash
cd milestone4/frontend
npm install
npm run dev
```
It starts on port **5174** to avoid port conflicts with the core client on port **5173**.

### Independent Frontend Routes:
* `/milestone4/report/:sessionId` (Displays comprehensive report dashboard and print layout)
* `/milestone4/history/:athleteId` (Displays custom responsive SVG-based trend lines)
* `/milestone4/notifications/:athleteId` (Alert center dashboard and manual check trigger)

---

## Print Layouts
Includes `@media print` rules within `milestone4/frontend/index.css` to hide headers, filter selectors, and trigger buttons during window print operations (`window.print()`). Adjusts padding, margins, and borders to render a professional physical report structure.

---

## Verification & Testing Results
All test suites pass successfully on execution:

### Backend:
* `test_milestone4.py` (5 tests) - **Passed**
* `test_routers.py` (6 tests) - **Passed**

### Frontend:
* `test_frontend.js` (3 integration tests) - **Passed**
* Vite Production Build - **Compiled Successfully (code 0)**

---

## Strict Isolation Rules
1. **Zero modifications** to folders: `milestone1/`, `milestone2/`, `milestone3/`.
2. **Zero modifications** to files: `frontend/src/App.jsx`, `frontend/vite.config.js`, `frontend/src/index.css`, `frontend/package.json`.
3. **No junctions or symlinks** inside `frontend/src/` or `backend/app/`.
4. Milestone 4 reads Milestone 2 & 3 databases through clean integration layers.
