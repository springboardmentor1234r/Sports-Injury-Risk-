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
3. **Risk Scoring Engine**: Merges biomechanics with historical injury data to assign a Health Score and Risk Category.
4. **AI Recommendation Engine**: Uses Large Language Models (LLMs) to translate raw flaws into plain-English and assigns pre-approved corrective exercises.

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

To run the full pipeline, execute the main script and pass the name of a video located in your `data/raw_videos` folder (e.g., `sports.mp4`):

```bash
python src/main.py --video_name sports
```

*Note: If you run `python src/main.py` without arguments, it will prompt you to select a video or use a live webcam feed.*

The pipeline will execute, print a clean summary to your terminal, and save a full, detailed recommendation report to the `outputs/risk_scores` directory.

## Configuration

- **API Keys**: This project uses Groq's LLM for the recommendation engine. You must add your Groq API key to a `.env` file in the root directory:
  ```env
  GROQ_API_KEY=your_api_key_here
  ```
- **Directories and Thresholds**: General configurations, file paths, and joint angle thresholds can be modified in `src/config.py`.
- **Athlete Profiles**: You can update historical injury and training load data by editing `data/profiles/athlete_profile.csv`.

## Features

- **Automated Video Processing**: Hands-free biomechanical analysis from raw video files or live webcams.
- **Detailed Dashboards**: Quickly view an athlete's Overall Health Score, Movement Quality, Biomechanical Efficiency, and Fatigue Levels.
- **Plain-English Feedback**: AI translates technical, medical jargon into easy-to-understand summaries for coaches and athletes.
- **Personalized Rehab Plans**: Automatically generated corrective exercise recommendations based on specific detected flaws.
- **Exportable Reports**: All findings are saved as both structured `.csv` data and clean `.txt` reports for tracking over time.

---
*Disclaimer: This is an AI-assisted movement screening tool based on video pose estimation and rule-based analysis. It is not a medical diagnosis. Please consult a physiotherapist or doctor for professional evaluation and treatment.*