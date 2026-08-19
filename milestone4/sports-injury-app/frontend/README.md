# Milestone 4 — Team Analytics, Reports & Deployment

This milestone turns individual athlete data into team-wide insight, adds exportable reports, and makes the platform deployable outside a developer's laptop.

## Features

* Team-wide risk overview dashboard
* PDF export of an athlete's risk assessment
* Excel export of training load history
* Full Docker containerization (backend, frontend, database)
* Deployment blueprint for Render (cloud hosting)

## Key Highlights

* Roster sorted highest-risk-first, so staff see who needs attention immediately
* Reports carry the same "not a diagnosis" disclaimer as the in-app view
* One command (`docker compose up`) runs the entire stack locally
* Infrastructure-as-code deployment — no manual server setup

## Outcome

* A coach or physiotherapist can see risk across an entire team at a glance
* Risk assessments and training data can be saved, shared, or printed
* The application can be deployed to the cloud, not just run locally

## Notes

* Deployment has not been tested end-to-end on a live cloud environment
* No Team/Organization model yet — staff currently see every athlete, not just their own roster
* Free-tier cloud hosting may not have enough memory for video processing at scale
