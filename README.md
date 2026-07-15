# KineticGuard - Sports Injury Risk Detection

KineticGuard is a premium, modern SaaS platform designed for high-performance athletic biomechanics telemetry, injury risk monitoring, and athlete profile management. It provides role-based access for Coaches, Physiotherapists, Sports Scientists, Athletes, and Admins.

---

## 🚀 Features Implemented

### 1. Robust Authentication & Security
* **JWT Authorization:** Automated Bearer token authentication and interceptor layers.
* **Role-Based Access Control (RBAC):** Customized dashboards, actions, and table headers depending on the user's role:
  * **Athlete:** Personal biometric card, self-registration, and self-profile editing.
  * **Coach:** Full registry visibility with performance stats, creation, and updating of athlete files.
  * **Physiotherapist:** Clinical registry views showing injury logs and medical notes.
  * **Sports Scientist:** Registry tables tracking training load index and fitness indicators.
  * **Admin:** Full read/write/edit/delete authority across all athlete files.

### 2. User Experience & Aesthetics
* **Theme Switching:** Premium Light and Dark theme selections with persistent user caching.
* **Modern SaaS Layout:** Clean typography (Outfit font) and responsive frosted glass card panels.
* **Data Shimmer Skeletons:** Skeleton placeholders shown during API fetches to prevent layout shifts.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS (v4), Framer Motion, Lucide Icons
* **Backend:** FastAPI (Python 3.13), Uvicorn, BCrypt, PyJWT
* **Database:** MongoDB (Motor driver Async client)

---

## 📁 Folder Structure

```text
sports-injury-risk/
├── backend/                  # FastAPI Python backend
│   └── app/
│       ├── main.py           # Application entrypoint & CORS middleware
│       ├── database.py       # MongoDB client configuration
│       ├── utils/auth.py     # BCrypt utilities & JWT signing
│       ├── models/athlete.py # MongoDB database models
│       ├── schemas/          # Pydantic validation schemas
│       └── routers/          # API route endpoint controllers
├── frontend/                 # Vite React.js frontend
│   ├── src/
│   │   ├── App.jsx           # Routing & lazy-loaded pages
│   │   ├── index.css         # Theme styles & variables
│   │   ├── utils/api.js      # Axios client interceptor
│   │   ├── components/       # Reusable UI component library
│   │   └── pages/            # Page view controllers
│   └── public/               # Static media & assets
└── milestone_1/              # Milestone 1 documentation summary
```

---

## 🔧 Setup & Installation

### Prerequisite Services
* Ensure a local MongoDB server is running on `mongodb://localhost:27017`.

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Initialize virtual environment and install packages:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Boot backend listener:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch development server:
   ```bash
   npm run dev
   ```

### 3. Quick Run Script
Alternatively, run the root-level script from the parent folder to start both services concurrently:
* **Windows Command Prompt / PowerShell:** `run.bat`