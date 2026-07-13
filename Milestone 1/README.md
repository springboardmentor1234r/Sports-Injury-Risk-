#  Sports Injury Risk Detection
### Milestone 1 – Backend Development

An AI-powered Sports Injury Risk Detection system designed to help athletes, coaches, and sports professionals monitor athlete information securely. This milestone focuses on building a robust backend with authentication, authorization, and athlete profile management using FastAPI and PostgreSQL.

---

##  Milestone 1 Objectives

- Build a secure REST API using FastAPI
- Connect the application with PostgreSQL
- Implement JWT Authentication
- Implement Role-Based Access Control (RBAC)
- Develop Athlete Profile Management APIs
- Test all APIs using Swagger UI

---

#  Features Implemented

## ✅ Authentication

- User Registration
- User Login
- JWT Token Generation
- Protected API Endpoints
- Current User Endpoint (`/auth/me`)

---

## ✅ Role-Based Access Control (RBAC)

Supported Roles:

- Athlete
- Coach
- Physiotherapist
- Sports Scientist
- Admin

Access permissions are enforced using dependency-based authorization.

Examples:

- Athletes can manage only their own profile.
- Coaches and staff can view athlete information.
- Unauthorized access returns **403 Forbidden**.

---

## ✅ Athlete Profile Management

Athletes can:

- Create Profile
- View Profile
- Update Profile

Profile includes:

- Sport Type
- Playing Position
- Age
- Height
- Weight
- Injury History
- Training Load

---

# 🗄 Database

Database: **PostgreSQL**

ORM:

- SQLAlchemy

Validation:

- Pydantic Schemas

The database stores:

- User Information
- Athlete Profiles

---

# 🔐 Authentication Flow

```
Register User
      │
      ▼
Login
      │
      ▼
Receive JWT Token
      │
      ▼
Authorize via Swagger
      │
      ▼
Access Protected APIs
```

---

# 📡 API Endpoints

## Authentication

| Method | Endpoint | Description |
|----------|-------------------------|--------------------------|
| POST | `/auth/register` | Register User |
| POST | `/auth/login` | Login User |
| GET | `/auth/me` | Current Logged-in User |

---

## Athlete Profile

| Method | Endpoint | Access |
|----------|----------------------------------|----------------|
| POST | `/athletes/me/profile` | Athlete |
| GET | `/athletes/me/profile` | Athlete |
| PUT | `/athletes/me/profile` | Athlete |
| GET | `/athletes` | Coach / Staff / Admin |

---

# 🛠 Technology Stack

### Backend

- Python
- FastAPI

### Database

- PostgreSQL
- SQLAlchemy

### Authentication

- JWT (JSON Web Token)
- OAuth2 Password Bearer

### Validation

- Pydantic

### API Documentation

- Swagger UI (`/docs`)

---

# 📂 Project Structure

```
Milestone 1
│
├── backend
│   ├── app
│   │   ├── routers
│   │   │   ├── auth.py
│   │   │   └── athletes.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   │
│   └── .gitignore
│
├── requirements.txt
└── README.md
```

---

# ✅ API Testing

All endpoints were successfully tested using **FastAPI Swagger UI**.

Verified functionality includes:

- User Registration
- User Login
- JWT Authentication
- Protected Routes
- Athlete Profile CRUD
- Role-Based Access Control
- Permission Validation (403 Forbidden)
- Staff-only Athlete Listing

---

#  Milestone 1 Outcome

Successfully developed a secure backend system featuring:

- Secure Authentication
- JWT Authorization
- PostgreSQL Integration
- SQLAlchemy Models
- Athlete Profile CRUD APIs
- Role-Based Access Control
- Fully Tested REST APIs

---

# 👨‍💻 Developed By

**Rachit Patnaik**

B.Tech CSE (Data Science)  
ITER, Siksha 'O' Anusandhan University

GitHub: https://github.com/Rachit-Patnaik
