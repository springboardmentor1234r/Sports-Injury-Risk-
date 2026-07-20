# Sports Injury Risk Detection

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8%2B-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

An advanced, AI-assisted computer vision pipeline designed to analyze athletic movements (like squats, jumps, etc.), calculate injury risk scores, and provide actionable, personalized recommendations.

## Description

This project provides a fully automated, end-to-end pipeline that bridges the gap between raw video footage and professional-level biomechanical feedback. It is designed to help athletes and coaches identify risky movement patterns before they lead to injuries. 

The system operates in four seamless stages:
1. **Pose Extraction**: Tracks 33 critical body landmarks frame-by-frame from video or webcam feeds.
2. **Biomechanical Analysis**: Evaluates joint angles, balance sway, knee valgus, and left-vs-right body asymmetries.
3. **Risk Scoring Engine**: Merges biomechanics with historical injury data (from MongoDB) to assign a Health Score and Risk Category.
4. **AI Recommendation Engine**: Uses Large Language Models (LLMs) to translate raw flaws into plain-English and assigns pre-approved corrective exercises.

### Backend Architecture
This pipeline is designed for seamless web frontend integration:
- **Stateless Operation**: Intermediate CSV files are automatically deleted after processing to keep the server clean.
- **Database Persistence**: All biomechanics data, risk scores, and generated reports are stored permanently in **MongoDB**.
- **Object Storage**: Heavy video files are automatically uploaded to **Cloudinary** and securely linked in the database so your backend never hosts media files directly.
- **Decoupled Engines**: The heavy LLM processing (Recommendation Engine) runs completely independently of the fast video processing engine.
- **Demographics-Aware Scoring**: The core risk engine dynamically modifies injury risk using the athlete's exact Height, Weight (BMI), Age, Gender, and Primary Sport.

## Project Structure

Following enterprise software architecture standards, the core logic is cleanly separated into modular components:

```text
Sports-Injury-Risk-/
├── data/
│   ├── profiles/            # Manually defined athlete history CSVs
│   └── raw_videos/          # Input videos for the pipeline
├── database/                # MongoDB integration and operations
├── outputs/                 # Temporary directories (cleaned up automatically)
├── tests/                   # Pytest automated testing suite
└── src/
    ├── main.py              # Main entry point (Runs Step 1)
    ├── pose_extractor.py    # MediaPipe pose extraction script
    ├── config.py            # Global thresholds and directory paths
    ├── biomechanics/        # Pure math calculators and frame analyzers
    ├── risk_scoring/        # Health/Risk threshold rules and engine
    └── recommendations/     # LLM prompts and LangGraph orchestration
├── frontend/                # Next.js / Tailwind React Web Application
├── api/                     # FastAPI backend bridging the core engine and frontend
```

## Database Architecture

All persistent data operations are strictly handled by the `database/mongo_utils.py` module. The project uses a NoSQL document-based structure in MongoDB to store pipeline results across four core collections:

1. **`athlete_profiles`**: Stores static user data (e.g., `athlete_id`, `has_previous_injury`, `weekly_training_sessions`, `height`, `weight`, `age`, `gender`, `sport`). This must be populated before processing a video, as the risk engine uses demographics to multiply or penalize risk baselines.
2. **`sessions`**: Tracks each unique video analysis run with a unique UUID (`session_id`), linking the video name to the athlete.
3. **`biomechanics`**: Stores the heavy, frame-by-frame joint angle calculations and the overall mathematical summaries (range of motion, valgus).
4. **`risk_scores`**: Stores the final 0-100 risk score, category, and a list of flagged movement flaws.
5. **`recommendations`**: Stores the raw AI generated JSON summary, including the core one-line summary and structured corrective exercise categories.

## Installation

1. Clone the repository and navigate into the directory:
   ```bash
   git clone <repository-url>
   cd Sports-Injury-Risk-
   ```

2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

The pipeline is split into two independent flows to optimize speed and frontend integration.

### Step 1: Process Video & Calculate Risk
Execute the main script and pass the athlete's ID (for MongoDB linkage) and optionally the name of a video located in your `data/raw_videos` folder:

```bash
python src/main.py --athlete_id "athlete_001" --video_name sports
```
*(If you do not provide `--video_name`, the script will prompt you to select a video or use a live webcam feed).*

The script will:
1. Process the video and calculate biomechanical flaws.
2. Pull the athlete's historical data from MongoDB.
3. Print a fast "Risk Score Report" directly to the terminal.
4. Securely upload the generated `_annotated.mp4` video to Cloudinary.
5. Save the risk data and Cloudinary URL to MongoDB and **clean up/delete** all temporary CSV and `.mp4` files on your hard drive.

### Step 2: Generate Premium Recommendations (Optional)
Once a session is processed, you can generate detailed, AI-driven corrective exercises by running the recommendation engine manually using the Session ID generated in Step 1:

```bash
python src/recommendations/engine.py --video_name "sports" --session_id "YOUR_SESSION_ID"
```

The script will:
1. Query MongoDB for the specific session's risk scores.
2. Connect to Groq/LangGraph to generate a personalized rehab plan.
3. Save the full, massive text report string directly to the `full_recommendation_reports` collection in MongoDB for your frontend to download.

## Configuration

- **API Keys & Database**: This project requires a MongoDB instance, a Groq API key, and a Cloudinary account. You must add these to a `.env` file in the root directory:
  ```env
  GROQ_API_KEY=your_api_key_here
  MONGO_URI=mongodb://localhost:27017
  MONGO_DB_NAME=sports_injury_db
  CLOUDINARY_URL=cloudinary://your_api_key_here@your_cloud_name
  ```
- **Directories and Thresholds**: General configurations, file paths, and joint angle thresholds can be modified in `src/config.py`.
- **Athlete Profiles**: Athlete history is read from the `athlete_profiles` collection in MongoDB. (Insert a document with `athlete_id`, `has_previous_injury`, `weekly_training_sessions`, etc., before running the pipeline).

## API Backend Integration

The project now includes a high-performance **FastAPI** backend located in the `api/` directory. This acts as a bridge between the core Python logic and your web frontend (React/Next.js).

### Features
- **JWT Authentication**: Validates users against a MySQL database. Client identity (`athlete_id`) is strictly extracted from the secure token.
- **REST Endpoints**: Exposes endpoints for uploading videos, generating recommendations, and retrieving profiles.
- **Client-Side PDFs**: Serves structured JSON to the frontend, which handles dynamically rendering and downloading A4-sized PDF reports natively in the browser via React, `html-to-image`, and `jsPDF`.

To run the API server:
```bash
uvicorn api.server:app --reload --port 8000
```
Then navigate to `http://localhost:8000/docs` to view the interactive Swagger API documentation. For detailed endpoint information, see [API.md](./API.md).

### Web Frontend (Next.js)
A complete, Acet Labs-styled web application is located in the `frontend` directory. 
To launch the frontend dashboard:
```bash
cd frontend
npm install
npm run dev -- -p 3000
```

## Testing

This project includes a robust, automated end-to-end test suite that simulates the pipeline without writing any test data to your MongoDB. 

To run the full pipeline test (which safely reroutes all outputs to a `tests/test_outputs` directory):
```bash
pytest tests/test_pipeline.py
```

## Features

- **Automated Video Processing**: Hands-free biomechanical analysis from raw video files or live webcams.
- **Database Persistence**: Fully integrated with MongoDB to permanently save session data, risk scores, and final textual reports.
- **Auto-Cleanup**: Intermediate CSV files are automatically wiped after processing to preserve hard drive space.
- **Detailed Dashboards**: Quickly view an athlete's Overall Health Score, Movement Quality, Biomechanical Efficiency, and Fatigue Levels.
- **Plain-English Feedback**: AI translates technical, medical jargon into easy-to-understand summaries for coaches and athletes.
- **Personalized Rehab Plans**: Automatically generated corrective exercise recommendations based on specific detected flaws.

---
*Disclaimer: This is an AI-assisted movement screening tool based on video pose estimation and rule-based analysis. It is not a medical diagnosis. Please consult a physiotherapist or doctor for professional evaluation and treatment.*