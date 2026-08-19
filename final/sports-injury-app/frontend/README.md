# Vantage — Sports Injury Risk Detection from Video

An AI-assisted platform that analyzes athlete movement video and combines it with training and injury history to produce an explainable injury risk score.

## Features

* Role-based accounts (Athlete, Coach, Physiotherapist, Sports Scientist, Admin)
* Structured athlete records — injuries, performance, assessments, training load
* Video upload with automatic pose estimation (33 body keypoints per frame)
* Biomechanical analysis — joint angles, range of motion, left/right symmetry
* Injury risk score (0–100), combining:

  * Biomechanical analysis
  * Movement asymmetry
  * Injury history
  * Training load (ACWR)
  * Fatigue trends
* Team-wide risk overview dashboard
* PDF and Excel report export
* Dockerized and deployable to the cloud

## Key Highlights

* Every permission enforced server-side, not just hidden in the UI
* Risk scoring built on published sports-science thresholds, with a full factor-by-factor breakdown
* Handles missing data by excluding it and flagging the gap, never by guessing
* 86 automated tests across backend and frontend, including real bugs caught and fixed
* Runs locally with one command via Docker, or in the cloud via Render

## Outcome

* A working, tested, end-to-end platform: upload a video, get a skeleton-overlay analysis, and see an explainable injury risk score
* A team-wide view so staff can prioritize which athletes need attention
* Exportable reports for sharing outside the app

## Notes

* Not clinically validated — the risk score is a screening aid, not a diagnosis
* No Team/Organization model yet — staff currently see every athlete, not just their own roster
* Local disk storage and in-process background jobs — fine for one deployment, not yet built for multi-server scale
