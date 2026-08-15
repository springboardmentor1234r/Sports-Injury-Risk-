# ============================================================
# MoveIQ Backend Dockerfile
# Used by: api, worker, beat containers (same image, diff CMD)
# ============================================================

# ---- Stage 1: Builder ----
# Install all Python dependencies into an isolated prefix
FROM python:3.11-slim AS builder

WORKDIR /app

# Install OS-level build tools and libraries required by:
# - opencv-python-headless → libGL
# - mediapipe             → libglib2.0
# - psycopg2-binary       → libpq-dev
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libgl1 \
    libglib2.0-0 \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first (Docker layer cache optimization)
COPY requirements.txt .

# Install all Python packages into /install prefix
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ---- Stage 2: Runtime ----
# Minimal final image — only the installed packages, not build tools
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install only the runtime OS libraries (no build tools like gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# Copy the entire project source code
COPY . .

# Create the temp upload directory used for video buffering
RUN mkdir -p /app/temp

# NOTE: No CMD here — docker-compose.yml sets the command per-service
# api:    uvicorn api.server:app --host 0.0.0.0 --port 8000
# worker: celery -A src.worker.celery_app worker ...
# beat:   celery -A src.worker.celery_app beat ...
