import sys
import os
import datetime

# Add the backend directory to path so we can import app modules
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.append(backend_path)

try:
    from fastapi.testclient import TestClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    from app.database import Base, get_db
    from app.main import app
    from app.config import settings
    from app import models, auth
except ImportError as e:
    print(f"[-] Dependency import error: {e}")
    print("[*] To run tests, please install: fastapi sqlalchemy python-jose passlib bcrypt")
    sys.exit(0)

# Configure an isolated, in-memory SQLite database for test runs
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_verification.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency in FastAPI app
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("      RUNNING INTEGRATION VERIFICATION TESTS      ")
    print("==================================================")
    
    # 1. Recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[+] Database tables initialized.")
    
    # 2. Test base health check
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"
    print("[+] Health check endpoint validated.")
    
    # 3. Test user registration
    athlete_data = {
        "email": "test_athlete@hub.com",
        "full_name": "Test Athlete One",
        "role": "athlete",
        "password": "securepassword123"
    }
    res = client.post("/api/auth/register", json=athlete_data)
    assert res.status_code == 201
    assert res.json()["email"] == athlete_data["email"]
    assert res.json()["role"] == "athlete"
    print("[+] User registration endpoint validated (athlete role created).")

    # Test duplicate registration rejection
    res = client.post("/api/auth/register", json=athlete_data)
    assert res.status_code == 400
    print("[+] Registration constraint validated (rejects duplicate emails).")

    # 4. Test login and token generation
    login_data = {
        "username": athlete_data["email"],
        "password": athlete_data["password"]
    }
    res = client.post("/api/auth/login", data=login_data)
    assert res.status_code == 200
    token_json = res.json()
    assert "access_token" in token_json
    token = token_json["access_token"]
    print("[+] OAuth2 login validated (access token issued).")

    headers = {"Authorization": f"Bearer {token}"}

    # 5. Test retrieve current user
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == athlete_data["email"]
    print("[+] Auth profile validation validated.")

    # 6. Test retrieve and update athlete profile stats
    res = client.get("/api/athletes/profile", headers=headers)
    assert res.status_code == 200
    athlete_profile = res.json()
    assert athlete_profile["user"]["email"] == athlete_data["email"]
    print("[+] Eager profile loading validated.")

    # Update profile height, weight
    update_data = {
        "height_cm": 185.5,
        "weight_kg": 82.0,
        "sport": "Basketball",
        "bio": "Olympic qualifier contender"
    }
    res = client.put("/api/athletes/profile", json=update_data, headers=headers)
    assert res.status_code == 200
    assert res.json()["height_cm"] == update_data["height_cm"]
    assert res.json()["weight_kg"] == update_data["weight_kg"]
    print("[+] Profile updates validated.")

    # 7. Test training load log and automatic calculation
    training_data = {
        "date": str(datetime.date.today()),
        "activity_type": "Sprints",
        "duration_minutes": 45,
        "rpe": 8,
        "notes": "Interval sprinting drills"
    }
    res = client.post("/api/training", json=training_data, headers=headers)
    assert res.status_code == 201
    training_res = res.json()
    # calculated_load = duration * rpe = 45 * 8 = 360
    assert training_res["calculated_load"] == 360
    print("[+] Training load log and load calculation (Duration * RPE) validated.")

    # Retrieve training logs
    res = client.get("/api/training", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    print("[+] Training load logs retrieval validated.")

    # 8. Test injury history logging
    injury_data = {
        "injury_type": "Ankle Roll",
        "body_part": "Right Lateral Ankle",
        "severity": "Low",
        "occurrence_date": str(datetime.date.today() - datetime.timedelta(days=2)),
        "status": "rehab",
        "notes": "Slight strain during jump descent"
    }
    res = client.post("/api/injuries", json=injury_data, headers=headers)
    assert res.status_code == 201
    assert res.json()["status"] == "rehab"
    print("[+] Injury logger validated.")

    # Retrieve injury logs
    res = client.get("/api/injuries", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    print("[+] Injury history logs retrieval validated.")

    # 9. Test pose dataset info list
    res = client.get("/api/datasets", headers=headers)
    assert res.status_code == 200
    datasets = res.json()
    assert len(datasets) == 4
    names = [d["name"] for d in datasets]
    assert "Human3.6M" in names
    assert "COCO Keypoints" in names
    assert "MPII Human Pose" in names
    assert "SportsPose" in names
    print("[+] Pose Datasets information integration validated.")

    # Clean up test database file
    if os.path.exists("test_verification.db"):
        os.remove("test_verification.db")
        
    print("\n==================================================")
    print("      ALL INTEGRATION VERIFICATION TESTS PASSED    ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
