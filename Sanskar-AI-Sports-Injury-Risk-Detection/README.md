# KineGuard AI - Sports Injury Risk Detection Setup

This repository contains the complete production-ready full-stack workspace structure for the **KineGuard AI Sports Injury Risk Detection** application. The codebase has been partitioned into separate Frontend (React + Vite) and Backend (Express + Node.js) modules following a clean, scalable folder architecture.

---

## 📂 Directory Layout

```
Infosys-SpringBoard Project/
├── Backend/                    # Node.js Express server configuration
│   ├── config/                 # Database configuration (db.js)
│   ├── controllers/            # Route controllers (.gitkeep)
│   ├── models/                 # Mongoose models (.gitkeep)
│   ├── routes/                 # API endpoint routing declarations (index.js with healthcheck)
│   ├── middleware/             # Custom express middleware (auth, error handlers)
│   ├── services/               # Internal business logic and external APIs (.gitkeep)
│   ├── utils/                  # Utility scripts (logger.js)
│   ├── uploads/                # Dynamic directory for uploaded action videos (.gitkeep)
│   ├── ai/                     # AI algorithms and pose estimation Python models (.gitkeep)
│   ├── .env                    # Local environment config (ports, Mongo connect URIs)
│   ├── .env.example            # Environment variables example template
│   ├── app.js                  # Express middleware chaining
│   ├── server.js               # Entry script starting HTTP server & DB connect
│   └── package.json            # Backend dependency configuration
│
├── Frontend/                   # React JS client app
│   ├── src/
│   │   ├── assets/             # Static SVGs, logos, and images
│   │   ├── components/         # Reusable structural UI components
│   │   ├── context/            # Global React Contexts (AuthContext.jsx)
│   │   ├── hooks/              # Custom React Hooks
│   │   ├── layouts/            # Dashboard page layout shells (DashboardLayout.jsx)
│   │   ├── pages/              # Routing page views (Dashboard, Login, RiskAnalysis, Diagnostics)
│   │   ├── services/           # Network request orchestrators (axiosInstance.js)
│   │   ├── utils/              # Helper utilities
│   │   ├── App.jsx             # React router declaration
│   │   ├── index.css           # Tailwind CSS directives & global glassmorphic styles
│   │   └── main.jsx            # DOM mounting script
│   ├── index.html              # Main HTML entry point (configured with premium Google Fonts)
│   ├── postcss.config.js       # PostCSS config for Tailwind CSS
│   ├── tailwind.config.js      # Tailwind configurations (custom colors, viewport)
│   ├── vite.config.js          # Vite config (configured for port 3000 & API reverse proxy)
│   └── package.json            # Client-side dependencies configuration
│
└── README.md                   # Setup and execution instructions (this file)
```

---

## ⚡ Setup & Execution Guide

Due to Windows terminal sandbox ACL security constraints (`opening NUL for ACL write: Access is denied`), please run the installation and execution commands in your own external terminal window.

### 1. Backend Setup

1. Open your terminal and navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Check `.env` configuration. A default `.env` has been generated for you pointing to `mongodb://localhost:27017/sports_injury_detection`. Ensure your local MongoDB database service is running.
4. Launch the server in development mode:
   ```bash
   npm run dev
   ```
   *The server will start up on `http://localhost:5000`. You should see `[INFO] ... MongoDB Connected: ...` in your console.*

### 2. Frontend Setup

1. Open a second terminal window and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The Vite server will start on `http://localhost:3000`. Open this URL in your web browser.*

---

## 🛡️ Authentication & Verification

- **Demo Route Protection**: The client-side dashboard routes are secured via a simulated `ProtectedRoute` wrapper connected to `AuthContext`.
- **Sign In Credentials**: To sign in, navigate to `http://localhost:3000/login` and input any email and password. Click **Sign In** to mock a successful JWT registration and gain access to the dashboard dashboard panels.
- **Proxy and Axios Integration**: In the sidebar, click the **System Diagnostics** tab to run a real-time request to the Backend's `/api/health` endpoint. If the backend is running, this page will display a success badge showing live uptime and server timestamp metrics!
