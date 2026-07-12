# AI Sports Injury Detection - Backend

## Overview

This is the backend server for the **AI Sports Injury Detection** project developed as part of the Infosys Internship.

The backend provides REST APIs for:

- User Authentication
- Role-Based Access Control
- Athlete Profile Management
- Database Operations
- Future AI Model Integration

The server is built using **Node.js**, **Express.js**, and **MongoDB**.

---

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs
- dotenv
- CORS
- Multer
- Cloudinary

---

## Project Structure

```
backend/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── uploads/
├── server.js
├── package.json
├── .env
└── README.md
```

---

## Features

### Authentication

- User Registration
- User Login
- Password Hashing
- JWT Token Generation
- Protected Routes

### Athlete Management

- Create Athlete Profile
- View Athlete Details
- Update Athlete Profile
- Delete Athlete Profile

### Security

- Password Encryption
- JWT Authentication
- Environment Variables
- Role-Based Authorization

---

## Installation

Clone the repository

```bash
git clone <repository-url>
```

Move to backend directory

```bash
cd backend
```

Install dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## Running the Server

Development mode

```bash
npm run dev
```

Production mode

```bash
npm start
```

Server runs on

```
http://localhost:5000
```

---

## API Endpoints

### Authentication

| Method | Endpoint           |
| ------ | ------------------ |
| POST   | /api/auth/register |
| POST   | /api/auth/login    |
| GET    | /api/auth/profile  |

### Athlete

| Method | Endpoint          |
| ------ | ----------------- |
| POST   | /api/athletes     |
| GET    | /api/athletes     |
| GET    | /api/athletes/:id |
| PUT    | /api/athletes/:id |
| DELETE | /api/athletes/:id |

---

## Future Enhancements

- Video Upload
- Pose Estimation
- Injury Risk Prediction
- AI Model Integration
- Performance Analytics Dashboard
- Injury Reports

---

## Developed For

Infosys Internship Project

**Project:** AI Sports Injury Detection

This backend serves as the foundation for authentication, athlete management, and future AI-powered injury prediction.
