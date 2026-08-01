import pytest

@pytest.fixture
def app():
    from app.main import app
    return app
