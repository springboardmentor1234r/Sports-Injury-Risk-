# MoveIQ API Documentation

This document outlines all available API endpoints, their expected payloads, and required authentication levels. 

**Base URL:** `http://localhost:8000/api`

---

## 1. Authentication (`/auth`)
Handles all user registration, login, JWT issuance, and password management.
*All endpoints are rate-limited via SlowAPI.*

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/auth/send-signup-otp` | `POST` | No | Sends an OTP to email for signup verification (Limit: 3/15m). |
| `/auth/register` | `POST` | No | Creates a new user. Requires email, password, full_name, valid OTP, and role. |
| `/auth/login` | `POST` | No | Authenticates user and returns JWT Bearer token. |
| `/auth/forgot-password` | `POST` | No | Sends OTP for password reset. |
| `/auth/reset-password` | `POST` | No | Resets password using OTP and new strong password. |
| `/auth/me` | `GET` | **Yes** | Returns details of the currently authenticated user. |
| `/auth/account` | `PUT` | **Yes** | Updates user full name and email. |
| `/auth/password` | `PUT` | **Yes** | Updates password (requires old password verification). |
| `/auth/google/login` | `GET` | No | Redirects to Google OAuth2 consent screen. |

---

## 2. Sessions & Analysis (`/sessions`)
Handles the upload, tracking, and retrieval of video analyses.

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/sessions/upload-and-analyze` | `POST` | **Yes** | Accepts a video file (max 500MB). Triggers background Celery task. Returns `session_id` and `task_id`. Coaches can upload for assigned athletes using `athlete_id` Form param. |
| `/sessions/history` | `GET` | **Yes** | Returns a list of all past sessions for the authenticated athlete. Includes optimized batched risk and biomechanics data. |
| `/sessions/{session_id}` | `GET` | **Yes** | Retrieves full details of a specific session. (Secured: Coach/Admin or owner only). |
| `/sessions/{session_id}` | `DELETE` | **Yes** | Deletes a session and all related MongoDB artifacts (Biomachanics, Risk Scores, Recommendations). |
| `/sessions/{session_id}/report/download` | `GET` | **Yes** | Generates and returns a downloadable PDF report of the biomechanical analysis. |
| `/sessions/{session_id}/recommendation` | `GET` | **Yes** | Asynchronously queries Groq LLM to generate plain-text recommendations based on the risk score. Returns cached version if previously generated. |

---

## 3. WebSockets (`/ws`)
Handles all real-time communication. *Token must be passed as a query parameter `?token=...`*

| Endpoint | Protocol | Auth Required | Description |
|----------|----------|---------------|-------------|
| `/ws/progress/{session_id}` | `WS` | **Yes** | Subscribes to a Redis PubSub channel to receive live JSON updates as the Celery worker progresses through video processing steps. |
| `/ws/notifications` | `WS` | **Yes** | Global notification channel for the user (e.g., "Analysis Complete", "New Chat Message"). |
| `/ws/chat` | `WS` | **Yes** | Two-way communication channel. Handles `send_message` and `mark_read` actions. Persists data to MongoDB asynchronously to prevent event-loop blocking. |

---

## 4. Coach Management (`/coach`)
Specific endpoints for users with the `coach` role.

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/coach/athletes` | `GET` | **Yes (Coach)** | Returns a list of all athletes assigned to this coach's code. |
| `/coach/athletes/search` | `GET` | **Yes (Coach)** | Queries Elasticsearch to perform fuzzy searches across the global athlete directory. |
| `/coach/assign` | `POST` | **Yes (Coach)** | Assigns an athlete to the coach. |
| `/coach/sessions/{athlete_id}` | `GET` | **Yes (Coach)** | Allows a coach to view the session history of a specifically assigned athlete. |

---

## 5. Webhooks (`/webhooks`)
Server-to-server endpoints.

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/webhooks/cloudinary` | `POST` | Implicit | Cloudinary hits this endpoint when background video transformations complete. Updates MongoDB and triggers WebSocket notifications. |
