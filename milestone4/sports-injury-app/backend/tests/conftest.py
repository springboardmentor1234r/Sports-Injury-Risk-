"""
tests/conftest.py
--------------------
Shared pytest fixtures for the backend test suite.

IMPORTANT: these tests run against a REAL PostgreSQL database, not an
in-memory substitute -- we're using Postgres-specific column types (native
UUID, JSON) that don't have a perfect SQLite equivalent, and testing against
the same database engine you deploy on is worth more than testing against a
convenient stand-in that behaves subtly differently.

Set TEST_DATABASE_URL (in your .env, or exported in your shell) to a
DIFFERENT database than your regular DATABASE_URL -- these tests TRUNCATE
every table before each test runs. Pointing this at your dev database will
wipe any data you've entered manually while testing the app by hand.

    createdb sports_injury_test_db
    # then in .env:
    TEST_DATABASE_URL=postgresql://sports_user:sports_pass@localhost:5432/sports_injury_test_db
"""

import os
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    pytest.exit(
        "\n\nTEST_DATABASE_URL is not set. Create a separate test database and set "
        "TEST_DATABASE_URL in your .env (see the docstring at the top of tests/conftest.py "
        "for the exact commands). Refusing to guess, since running these tests against the "
        "wrong database would silently wipe its data.\n",
        returncode=1,
    )

test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def _create_test_schema():
    Base.metadata.create_all(bind=test_engine)
    yield


@pytest.fixture(autouse=True)
def _clean_database():
    """Truncates every table before each test, so tests don't leak state into each other."""
    with test_engine.connect() as conn:
        table_names = ", ".join(f'"{t.name}"' for t in reversed(Base.metadata.sorted_tables))
        conn.execute(text(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE"))
        conn.commit()
    yield


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_video_bytes():
    """
    Placeholder video bytes for upload tests. The pose-estimation call itself
    is mocked in these tests (see test_videos_api.py), so this file's actual
    contents don't need to be a valid, decodable video -- only its extension
    matters to the upload endpoint's validation.
    """
    return b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 512
