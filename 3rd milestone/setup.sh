#!/bin/bash
echo "Setting up Sports Injury Risk Detection Platform..."
mkdir -p volumes/postgres volumes/mongodb volumes/minio volumes/redis
cp deployment/.env.example .env
echo "Setup complete. Run 'make up' to start services."
