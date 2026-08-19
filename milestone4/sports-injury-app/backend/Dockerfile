# Python 3.11 specifically -- mediapipe==0.10.13 (pinned deliberately, see
# requirements.txt) has no published wheels for Python 3.12+, matching the
# exact issue hit during local Windows setup earlier in this project.
FROM python:3.11-slim

WORKDIR /app

# System libraries OpenCV needs even in "headless" server environments --
# without these, `import cv2` fails inside the container with a missing
# libGL.so error, even though the exact same code works fine on a desktop
# OS where these libraries are already present.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Video storage needs to exist and be writable -- in production this
# directory should be a mounted volume (see docker-compose.yml) so uploaded
# videos survive a container restart; without a volume, they'd be lost the
# moment the container is recreated, since the filesystem inside a container
# is ephemeral by default.
RUN mkdir -p storage/videos

EXPOSE 8000

# Runs pending migrations, then starts the server. Using an entrypoint
# script instead of one long CMD line here so this is easy to extend later
# (e.g. seeding data, waiting for the database to be reachable).
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
