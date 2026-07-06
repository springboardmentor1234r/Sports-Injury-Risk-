# Functional Requirements

## Introduction

Functional requirements describe the core functionalities that the AI Sports Injury Risk Detection Platform must provide to its users. These requirements define the behavior of the system and the features that will be implemented throughout the project.

---

# Functional Requirements

## FR-01 User Registration

### Description
The system shall allow new users to create an account.

### Inputs
- Name
- Email
- Password
- Role

### Outputs
- User account created successfully.

---

## FR-02 User Login

### Description
The system shall authenticate registered users using email and password.

### Inputs
- Email
- Password

### Outputs
- JWT Access Token
- Login Success Message

---

## FR-03 Role-Based Access Control

### Description

The system shall restrict access based on user roles.

Supported Roles:

- Athlete
- Coach
- Physiotherapist
- Sports Scientist
- Administrator

Each role will have different permissions.

---

## FR-04 Athlete Profile Management

### Description

The system shall allow authorized users to manage athlete profiles.

Operations include:

- Create Athlete
- View Athlete
- Update Athlete
- Delete Athlete

Athlete information includes:

- Athlete ID
- Name
- Age
- Gender
- Height
- Weight
- Sport
- Position
- Injury History
- Training Load

---

## FR-05 Injury History Management

The system shall maintain previous injury records for every athlete.

Information includes:

- Injury Name
- Injury Date
- Recovery Status
- Medical Notes

---

## FR-06 Training Profile Management

The system shall store athlete training information.

Training profile includes:

- Training Hours
- Weekly Load
- Coach Name
- Training Type

---

## FR-07 Video Upload

The system shall allow athletes to upload sports movement videos.

Supported formats:

- MP4
- AVI
- MOV

The system shall validate video quality before processing.

---

## FR-08 Video Processing

The system shall:

- Extract frames
- Improve image quality
- Prepare videos for AI analysis

---

## FR-09 Pose Estimation

The system shall:

- Detect body joints
- Generate body skeleton
- Track joint movement

Keypoints include:

- Head
- Shoulder
- Elbow
- Wrist
- Hip
- Knee
- Ankle

---

## FR-10 Biomechanical Analysis

The system shall calculate:

- Knee Angle
- Hip Angle
- Trunk Lean
- Joint Alignment
- Movement Symmetry
- Landing Mechanics

---

## FR-11 Injury Risk Prediction

The system shall:

- Analyze athlete movement
- Predict injury probability
- Detect abnormal movements
- Classify injury risk

Risk Levels:

- Low
- Moderate
- High
- Critical

---

## FR-12 Corrective Recommendations

The system shall recommend:

- Stretching Exercises
- Strength Training
- Mobility Exercises
- Recovery Plans
- Training Modifications

---

## FR-13 Dashboard

The system shall provide dashboards for:

### Athlete

- Injury Risk Score
- Performance Trends
- Recommendations

### Coach

- Team Performance
- Athlete Risk Analysis

### Physiotherapist

- Rehabilitation Progress
- Recovery Reports

### Sports Scientist

- Biomechanical Analytics

### Administrator

- User Management
- System Reports

---

## FR-14 Reports

The system shall generate:

- Injury Reports
- Performance Reports
- Biomechanical Reports

Supported exports:

- PDF
- Excel

---

## FR-15 Notifications

The system shall notify users about:

- High Injury Risk
- Recovery Reminder
- Assessment Completion
- Training Load Warning

---

# Milestone-wise Functional Requirements

## Milestone 1

- User Authentication
- JWT Authentication
- Role-Based Access Control
- Athlete Profile CRUD
- Database Setup
- Project Documentation

---

## Milestone 2

- Video Upload
- Pose Estimation
- Biomechanical Analysis

---

## Milestone 3

- Injury Prediction
- Risk Scoring
- Recommendations

---

## Milestone 4

- Dashboards
- Reports
- Docker Deployment
- Final Testing