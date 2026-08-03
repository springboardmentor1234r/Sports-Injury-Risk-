# Sports Injury Risk Detection Platform — backend
# Milestone 4: Docker containerization (PDF section 13)

FROM python:3.11-slim

WORKDIR /app

# System libraries needed by opencv-python-headless / mediapipe at import
# time, even in headless mode (libGL, glib, X11 stubs) — this is the
# standard list for getting cv2 to import cleanly inside a slim image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgl1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Video uploads and the mediapipe pose model live outside the image so
# they survive container restarts/rebuilds — see docker-compose.yml's
# volume mounts for backend/uploads.
RUN mkdir -p uploads/videos

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
