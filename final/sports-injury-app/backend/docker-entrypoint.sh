#!/bin/sh
set -e

# docker-compose's `depends_on` only waits for the Postgres CONTAINER to
# start, not for Postgres itself to be ready to accept connections -- those
# are different things, and the gap between them is exactly long enough to
# make migrations fail intermittently on a fresh `docker compose up` if this
# isn't handled explicitly.
echo "Waiting for database..."
until python -c "
import sys, os
from sqlalchemy import create_engine
try:
    create_engine(os.environ['DATABASE_URL']).connect().close()
except Exception as e:
    sys.exit(1)
"; do
  sleep 1
done
echo "Database is ready."

echo "Running migrations..."
alembic upgrade head

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
