import asyncio
import os
import sys
import uuid
from datetime import datetime

# Add app to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db
from app.auth import get_password_hash
from app.models import create_user_model, create_athlete_model, create_notification_model

SEED_DEMO_USERS = [
    {
        "full_name": "Alex Morgan (Athlete)",
        "email": "athlete@athletiq.ai",
        "alt_email": "athlete@kineguard.ai",
        "password": "Password123!",
        "role": "athlete"
    },
    {
        "full_name": "Coach Marcus Vance",
        "email": "coach@athletiq.ai",
        "alt_email": "coach@kineguard.ai",
        "password": "Password123!",
        "role": "coach"
    },
    {
        "full_name": "Dr. Sarah Lin (Physiotherapist)",
        "email": "physio@athletiq.ai",
        "alt_email": "physio@kineguard.ai",
        "password": "Password123!",
        "role": "physiotherapist"
    },
    {
        "full_name": "Dr. James Carter (Sports Scientist)",
        "email": "scientist@athletiq.ai",
        "alt_email": "scientist@kineguard.ai",
        "password": "Password123!",
        "role": "scientist"
    },
    {
        "full_name": "System Administrator",
        "email": "admin@athletiq.ai",
        "alt_email": "admin@kineguard.ai",
        "password": "Password123!",
        "role": "admin"
    }
]

SEED_ATHLETES = [
    {"name": "Virat Kohli", "sport_type": "Cricket", "position": "Batsman", "age": 35, "height": 175.0, "weight": 72.0, "injury_history": "Right shoulder strain (2023)", "training_load": "Heavy", "risk": 37.0, "risk_level": "Moderate Risk", "mq": 82.0, "health": 85.0},
    {"name": "Dhruv", "sport_type": "Cricket", "position": "Fast Bowler", "age": 24, "height": 182.0, "weight": 78.0, "injury_history": "Lumbar stress fracture (2022)", "training_load": "Extreme", "risk": 64.5, "risk_level": "High Risk", "mq": 71.0, "health": 68.0},
    {"name": "Sanskar", "sport_type": "Athletics", "position": "Sprinter (100m)", "age": 22, "height": 178.0, "weight": 70.0, "injury_history": "Left hamstring strain (2024)", "training_load": "Heavy", "risk": 48.0, "risk_level": "Moderate Risk", "mq": 78.0, "health": 80.0},
    {"name": "Aditi", "sport_type": "Badminton", "position": "Singles", "age": 21, "height": 168.0, "weight": 58.0, "injury_history": "Right ankle sprain (2023)", "training_load": "Moderate", "risk": 18.5, "risk_level": "Low Risk", "mq": 91.0, "health": 92.0},
    {"name": "Rahul", "sport_type": "Football", "position": "Midfielder", "age": 26, "height": 176.0, "weight": 74.0, "injury_history": "ACL tear right knee (2021)", "training_load": "Heavy", "risk": 58.0, "risk_level": "High Risk", "mq": 74.0, "health": 72.0},
    {"name": "Priya", "sport_type": "Basketball", "position": "Point Guard", "age": 23, "height": 172.0, "weight": 64.0, "injury_history": "Patellar tendinitis", "training_load": "Moderate", "risk": 28.0, "risk_level": "Moderate Risk", "mq": 84.0, "health": 86.0},
    {"name": "Arjun", "sport_type": "Running", "position": "Marathon Runner", "age": 28, "height": 174.0, "weight": 65.0, "injury_history": "Shin splints", "training_load": "Extreme", "risk": 42.0, "risk_level": "Moderate Risk", "mq": 80.0, "health": 79.0},
    {"name": "Sneha", "sport_type": "Volleyball", "position": "Outside Hitter", "age": 20, "height": 180.0, "weight": 68.0, "injury_history": "Shoulder impingement", "training_load": "Moderate", "risk": 22.0, "risk_level": "Low Risk", "mq": 88.0, "health": 90.0},
    {"name": "Kiran", "sport_type": "Tennis", "position": "Singles", "age": 25, "height": 185.0, "weight": 76.0, "injury_history": "Tennis elbow right arm", "training_load": "Heavy", "risk": 32.0, "risk_level": "Moderate Risk", "mq": 83.0, "health": 84.0},
    {"name": "Ananya", "sport_type": "Athletics", "position": "Long Jump", "age": 19, "height": 166.0, "weight": 55.0, "injury_history": "Left hip flexor tightness", "training_load": "Light", "risk": 15.0, "risk_level": "Low Risk", "mq": 94.0, "health": 95.0},
    {"name": "Rohit", "sport_type": "Cricket", "position": "Opening Batsman", "age": 36, "height": 173.0, "weight": 79.0, "injury_history": "Calf muscle strain (2023)", "training_load": "Moderate", "risk": 35.0, "risk_level": "Moderate Risk", "mq": 81.0, "health": 83.0},
    {"name": "Meera", "sport_type": "Football", "position": "Forward", "age": 22, "height": 169.0, "weight": 60.0, "injury_history": "Groin pull", "training_load": "Heavy", "risk": 29.5, "risk_level": "Moderate Risk", "mq": 85.0, "health": 87.0}
]

async def seed_data():
    db = get_db()
    await db.connect_to_database()

    users_coll = db.get_collection("users")
    athletes_coll = db.get_collection("athletes")
    analyses_coll = db.get_collection("analyses")
    recs_coll = db.get_collection("recommendations")
    notif_coll = db.get_collection("notifications")
    reports_coll = db.get_collection("reports")

    print("Seeding Athletiq AI database...")

    # 1. Seed Demo Users
    hashed_pwd = get_password_hash("Password123!")
    user_map = {}

    for u_info in SEED_DEMO_USERS:
        # Seed both primary @athletiq.ai and legacy @kineguard.ai alias for backward compatibility
        for email_addr in [u_info["email"], u_info["alt_email"]]:
            existing = await users_coll.find_one({"email": email_addr.lower()})
            if not existing:
                u_model = create_user_model(
                    full_name=u_info["full_name"],
                    email=email_addr,
                    hashed_password=hashed_pwd,
                    role=u_info["role"]
                )
                await users_coll.insert_one(u_model)
                user_map[u_info["role"]] = u_model["id"]
                print(f"Created demo user: {email_addr} ({u_info['role']})")
            else:
                user_map[u_info["role"]] = existing.get("id") or existing.get("_id")

    # 2. Seed 12 Athletes
    athlete_ids = []
    for idx, ath in enumerate(SEED_ATHLETES):
        existing = await athletes_coll.find_one({"name": ath["name"]})
        if not existing:
            # Link first athlete to demo athlete user account
            linked_user = user_map.get("athlete") if idx == 0 else None
            ath_model = create_athlete_model(
                name=ath["name"],
                sport_type=ath["sport_type"],
                position=ath["position"],
                age=ath["age"],
                height=ath["height"],
                weight=ath["weight"],
                injury_history=ath["injury_history"],
                training_load=ath["training_load"],
                user_id=linked_user
            )
            ath_model["recent_risk_score"] = ath["risk"]
            ath_model["risk_level"] = ath["risk_level"]
            ath_model["movement_quality_score"] = ath["mq"]
            ath_model["overall_health_score"] = ath["health"]
            ath_model["sessions_analyzed"] = 3
            await athletes_coll.insert_one(ath_model)
            athlete_ids.append(ath_model["id"])
            print(f"Seeded athlete profile: {ath['name']} ({ath['sport_type']})")
        else:
            athlete_ids.append(existing.get("id") or existing.get("_id"))

    # 3. Seed Sample Analyses & Recommendations
    if athlete_ids:
        sample_ath_id = athlete_ids[0]
        existing_analysis = await analyses_coll.find_one({"athlete_id": sample_ath_id})
        if not existing_analysis:
            analysis_id = str(uuid.uuid4())
            now_str = datetime.utcnow().isoformat()
            analysis_doc = {
                "_id": analysis_id,
                "id": analysis_id,
                "athlete_id": sample_ath_id,
                "athlete_name": "Virat Kohli",
                "video_name": "Sprint_Symmetry_Session_01.mp4",
                "video_url": "/uploads/demo_sprint.mp4",
                "frames_analyzed": 150,
                "analysis_date": now_str,
                "overall_risk_score": 37.0,
                "risk_level": "Moderate Risk",
                "movement_quality_score": 82.0,
                "biomechanical_efficiency_score": 78.5,
                "fatigue_risk_score": 34.0,
                "overall_health_score": 85.0,
                "biomechanics": {
                    "knee_angle": 146.5,
                    "hip_angle": 152.0,
                    "elbow_angle": 138.0,
                    "shoulder_angle": 135.0,
                    "trunk_lean": 14.5,
                    "knee_valgus": "Mild Valgus",
                    "hip_stability": "Good",
                    "movement_symmetry": 76.0,
                    "range_of_motion": 84.0,
                    "landing_mechanics": "Suboptimal Landing (Mild Valgus)",
                    "joint_alignment": "Asymmetric",
                    "balance_score": 79.0,
                    "overall_biomechanical_status": "Needs Attention"
                },
                "injury_predictions": {
                    "acl_risk": 37.5,
                    "hamstring_risk": 21.4,
                    "ankle_sprain_risk": 18.7,
                    "shoulder_risk": 28.2,
                    "lower_back_risk": 24.1,
                    "overuse_risk": 41.3
                },
                "anomaly_detection": {
                    "anomaly_detected": True,
                    "anomaly_score": 0.52,
                    "severity": "Moderate",
                    "affected_area": "Right Knee Alignment",
                    "description": "Repeated inward knee movement (valgus deviation) and slight trunk lean anomaly detected during sprint landing."
                },
                "recommendations": [
                    {
                        "id": str(uuid.uuid4()),
                        "athlete_id": sample_ath_id,
                        "analysis_id": analysis_id,
                        "category": "Corrective Exercises",
                        "title": "Single-Leg Balance & Glute Activation",
                        "description": "Perform band-resisted single-leg balance holds to stabilize knee alignment and reduce valgus inward collapse.",
                        "priority": "High",
                        "target_area": "Gluteus Medius & Right Knee",
                        "frequency": "3 sets x 12 reps (4x/week)",
                        "reason": "Detected mild knee valgus and 37.5% ACL risk.",
                        "status": "In Progress"
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "athlete_id": sample_ath_id,
                        "analysis_id": analysis_id,
                        "category": "Mobility",
                        "title": "Hip Flexor & Thoracic Extension Drills",
                        "description": "Perform half-kneeling hip flexor stretches to open up hip joint mobility and reduce forward trunk compensation.",
                        "priority": "Medium",
                        "target_area": "Hips & Thoracic Spine",
                        "frequency": "10 mins daily pre-practice",
                        "reason": "Trunk lean angle is elevated at 14.5°.",
                        "status": "Pending"
                    }
                ],
                "created_at": now_str
            }
            await analyses_coll.insert_one(analysis_doc)

            # Insert recs
            for r in analysis_doc["recommendations"]:
                r["created_at"] = now_str
                await recs_coll.insert_one(r)

            # Insert report
            await reports_coll.insert_one({
                "_id": str(uuid.uuid4()),
                "id": str(uuid.uuid4()),
                "athlete_id": sample_ath_id,
                "athlete_name": "Virat Kohli",
                "analysis_id": analysis_id,
                "video_name": "Sprint_Symmetry_Session_01.mp4",
                "generated_at": now_str,
                "overall_risk_score": 37.0,
                "risk_level": "Moderate Risk",
                "summary": "Video analysis completed. Detected mild knee valgus with 37.5% ACL risk score and 76% movement symmetry.",
                "download_url": f"/api/reports/{analysis_id}"
            })

            # Insert notification for athlete demo account
            ath_user_id = user_map.get("athlete")
            if ath_user_id:
                notif = create_notification_model(
                    user_id=ath_user_id,
                    title="Analysis Ready: Moderate Risk (37/100)",
                    message="Sprint_Symmetry_Session_01.mp4 has been processed. Recommended corrective exercises generated.",
                    priority="Warning"
                )
                await notif_coll.insert_one(notif)

            print("Seeded sample video analysis, recommendations, and notifications.")

    print("\n[SUCCESS] Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_data())
