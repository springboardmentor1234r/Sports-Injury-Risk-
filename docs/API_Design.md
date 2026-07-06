# API Design

## Introduction

The AI Sports Injury Risk Detection Platform exposes RESTful APIs for user authentication and athlete profile management. These APIs allow secure communication between the React frontend and the FastAPI backend.

---

# API Standards

- Architecture: REST
- Data Format: JSON
- Authentication: JWT
- Base URL: /api/v1

---

# Authentication APIs

## Register User

| Property | Value |
|----------|-------|
| Method | POST |
| Endpoint | /api/v1/auth/register |
| Authentication | No |

### Request

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "Athlete"
}
```

### Response

```json
{
  "message": "User registered successfully"
}
```

---

## Login

| Property | Value |
|----------|-------|
| Method | POST |
| Endpoint | /api/v1/auth/login |
| Authentication | No |

### Request

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

### Response

```json
{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer"
}
```

---

# Athlete APIs

## Create Athlete

| Property | Value |
|----------|-------|
| Method | POST |
| Endpoint | /api/v1/athletes |
| Authentication | Yes |

---

## Get All Athletes

| Property | Value |
|----------|-------|
| Method | GET |
| Endpoint | /api/v1/athletes |
| Authentication | Yes |

---

## Get Athlete by ID

| Property | Value |
|----------|-------|
| Method | GET |
| Endpoint | /api/v1/athletes/{id} |
| Authentication | Yes |

---

## Update Athlete

| Property | Value |
|----------|-------|
| Method | PUT |
| Endpoint | /api/v1/athletes/{id} |
| Authentication | Yes |

---

## Delete Athlete

| Property | Value |
|----------|-------|
| Method | DELETE |
| Endpoint | /api/v1/athletes/{id} |
| Authentication | Yes |

---

# HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

# Security

- JWT Authentication
- Password Hashing
- Role-Based Access Control
- Protected Endpoints

---

# Future APIs

The following APIs will be added in later milestones:

- Video Upload
- Pose Estimation
- Injury Prediction
- Recommendations
- Reports