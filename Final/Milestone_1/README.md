# Milestone 1: Authentication & Athlete Biometrics Management

## Overview
Milestone 1 delivers the foundational security, role-based access control (RBAC), and athlete profile registry for the KineticGuard platform.

## Key Features
- **JWT-Based Authentication**: Secure registration, login, token refresh, and salted password hashing with Bcrypt.
- **Multi-Role Access Control**: Granular permissions for `Athlete`, `Coach`, `Admin`, `Physiotherapist`, and `Sports Scientist`.
- **Biometric Athlete Registry**: Captures physical parameters (Age, Height, Weight, Sport, Position, Experience, Load, Medical Notes, Disability Flags).
- **Coach-Athlete Relationship**: Dynamic coach assignment and strict multi-tenant data isolation.
- **User Account Self-Service**: Full self-service profile updating (`PUT /me`) for all authenticated roles.
- **Dual-Theme SaaS UI**: Modern HUD Dark theme and high-contrast Light theme.

## Directory Structure
- `backend/`: FastAPI application (`app/`), database models, routers, schemas, static photo storage, and unit test suites.
- `frontend/`: React 18 single-page application with Tailwind CSS, Lucide icons, and biometric dashboard.
- `shared/`: Legacy prototype templates and shared database modules.
- `requirements.txt`: Python dependencies.
- `summary.md`: Milestone 1 completion summary.
