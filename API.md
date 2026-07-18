# Sports Injury Risk Detection API Documentation

This document outlines the RESTful API built with **FastAPI** to interact with the core Python data science pipeline.

## 🚀 Getting Started

Start the server using Uvicorn:
```bash
uvicorn api.server:app --reload --port 8000
```
Interactive Swagger documentation is automatically available at:
`http://localhost:8000/docs`

---

## 🔒 Authentication & Security

All secure endpoints require a **JWT (JSON Web Token)** passed in the HTTP Headers.
`Authorization: Bearer <your_jwt_token>`

**Security Rule:** The API completely ignores any `athlete_id` passed in request bodies or query parameters. The identity of the user is strictly extracted mathematically from the JWT. This prevents malicious users from querying or uploading videos to another athlete's account.

---

## 🔗 Endpoints

### 1. Authentication (`/api/auth`)
Handles user registration and login using MySQL and `bcrypt` password hashing.

- **`POST /api/auth/register`**
  - **Description**: Registers a new user in the MySQL database.
  - **Payload**: `{"email": "...", "password": "...", "full_name": "...", "role": "athlete"}`
  - **Returns**: `{"message": "User created successfully", "user_id": 1}`

- **`POST /api/auth/login`**
  - **Description**: Authenticates a user and generates a JWT.
  - **Payload**: `{"email": "...", "password": "..."}`
  - **Returns**: `{"access_token": "...", "token_type": "bearer", "user": {...}}`

- **`GET /api/auth/me`** *(Requires JWT)*
  - **Description**: Returns the decoded JWT payload of the currently logged-in user.

- **`PUT /api/auth/account`** *(Requires JWT)*
  - **Description**: Updates the logged-in user's name and email in the MySQL database.
  - **Payload**: `{"full_name": "...", "email": "..."}`

- **`PUT /api/auth/password`** *(Requires JWT)*
  - **Description**: Updates the logged-in user's password in the MySQL database after verifying the old password.
  - **Payload**: `{"old_password": "...", "new_password": "..."}`

### 2. Athlete Profiles (`/api/profile`)
Handles the reading and writing of athlete historical data in MongoDB.

- **`GET /api/profile`** *(Requires JWT)*
  - **Description**: Fetches the logged-in user's profile from the `athlete_profiles` collection.
  - **Returns**: JSON object containing injury history and training intensity.

- **`POST /api/profile`** | **`PUT /api/profile`** *(Requires JWT)*
  - **Description**: Upserts the user's profile data (including demographics for advanced risk scoring math) to MongoDB.
  - **Payload**: `{"has_previous_injury": "Yes", "injury_recency": "6 months ago", "previous_injury_type": "ACL Tear", "training_intensity": "High", "weekly_training_sessions": 5, "age": 25, "gender": "Male", "height": 180, "weight": 75, "sport": "Basketball"}`

### 3. Video Sessions (`/api/sessions`)
The core bridge to the `src.main` Python pipeline.

- **`POST /api/sessions/upload-and-analyze`** *(Requires JWT)*
  - **Description**: Accepts a video file, generates a safe unique filename, triggers the AI math pipeline, saves data to MongoDB, uploads the annotated video to Cloudinary, and instantly deletes temporary local files.
  - **Payload**: `multipart/form-data` with key `video` (file).
  - **Returns**: `{"session_id": "uuid", "risk_data": {...}, "video_url": "cloudinary_link"}`

- **`GET /api/sessions/history`** *(Requires JWT)*
  - **Description**: Fetches all past sessions linked to the logged-in athlete.
  - **Returns**: Array of session JSON objects (newest first).

- **`GET /api/sessions/{session_id}`** *(Requires JWT)*
  - **Description**: Retrieves a specific session's metadata. Includes authorization checks to ensure the user owns the session (unless they are an admin/coach).

### 4. AI Recommendations (`/api/recommendations`)
Integrates with LangGraph and Groq LLMs.

- **`POST /api/recommendations/{session_id}/generate`** *(Requires JWT)*
  - **Description**: Triggers the `src.recommendations.engine` to analyze the specific session's Risk Score and formulate an AI corrective exercise plan. Saves the massive text string to MongoDB.
  - **Returns**: `{"message": "Recommendations generated successfully"}`

- **`GET /api/recommendations/{session_id}/report`** *(Requires JWT)*
  - **Description**: Retrieves the raw JSON data of the full recommendation report for frontend display formatting.
  
- **`GET /api/recommendations/{session_id}/download`** *(Requires JWT)*
  - **Description**: Retrieves the Markdown string from MongoDB, dynamically parses it using `reportlab`, and streams an **on-the-fly generated PDF** back to the client.
  - **Returns**: Application/PDF file stream (`Rehab_Plan_{session_id}.pdf`).
