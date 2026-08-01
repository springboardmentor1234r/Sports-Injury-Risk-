# Architecture

The system uses a microservices architecture:
- **Frontend**: React application for user interaction
- **Backend**: FastAPI providing REST endpoints
- **Worker**: Celery workers for video processing
- **Databases**: PostgreSQL (relational data), MongoDB (time-series pose data), Redis (caching and message broker)
- **Storage**: MinIO for S3 compatible video storage
