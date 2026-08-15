import asyncio
import os
import sys
from datetime import datetime, timedelta
import uuid

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Database
from app.auth import hash_password
from app.engines.ml_prediction_engine import MLPredictionEngine
from app.engines.anomaly_detection_engine import AnomalyDetectionEngine
from app.engines.risk_scoring_engine import RiskScoringEngine
from app.engines.ai_recommendation_agent import AIRecommendationAgent


ATHLETES_DATA = [
    {
        "fullname": "Marcus Rashford",
        "email": "marcus.rashford@sird.com",
        "sport_type": "Soccer",
        "position": "Forward / Winger",
        "age": 26,
        "height": 180,
        "weight": 70,
        "injury_history": "Previous hamstring strain in 2023",
        "training_load": "16 hrs/week",
        "metrics": {"knee_valgus": 14.5, "hip_stab": 65.0, "trunk_lean": 16.2, "landing_flex": 28.0, "asym": 18.5, "com_drift": 1.4, "ankle_inv": 12.0, "lumbar_flex": 24.0, "shoulder_abd": 70.0, "load_hrs": 16.0, "has_hist": 1}
    },
    {
        "fullname": "Serena Williams",
        "email": "serena.williams@sird.com",
        "sport_type": "Tennis",
        "position": "Singles",
        "age": 28,
        "height": 175,
        "weight": 72,
        "injury_history": "Ankle sprain in 2022",
        "training_load": "18 hrs/week",
        "metrics": {"knee_valgus": 9.2, "hip_stab": 82.0, "trunk_lean": 11.0, "landing_flex": 45.0, "asym": 12.0, "com_drift": 2.6, "ankle_inv": 16.8, "lumbar_flex": 18.0, "shoulder_abd": 110.0, "load_hrs": 18.0, "has_hist": 1}
    },
    {
        "fullname": "LeBron James",
        "email": "lebron.james@sird.com",
        "sport_type": "Basketball",
        "position": "Power Forward",
        "age": 29,
        "height": 206,
        "weight": 113,
        "injury_history": "Groin tension in 2021",
        "training_load": "20 hrs/week",
        "metrics": {"knee_valgus": 7.8, "hip_stab": 88.0, "trunk_lean": 9.5, "landing_flex": 52.0, "asym": 8.2, "com_drift": 0.8, "ankle_inv": 8.0, "lumbar_flex": 15.0, "shoulder_abd": 95.0, "load_hrs": 20.0, "has_hist": 1}
    },
    {
        "fullname": "Erling Haaland",
        "email": "erling.haaland@sird.com",
        "sport_type": "Soccer",
        "position": "Striker",
        "age": 23,
        "height": 195,
        "weight": 88,
        "injury_history": "Groin discomfort in 2023",
        "training_load": "15 hrs/week",
        "metrics": {"knee_valgus": 12.1, "hip_stab": 72.0, "trunk_lean": 13.8, "landing_flex": 32.0, "asym": 16.0, "com_drift": 1.1, "ankle_inv": 9.5, "lumbar_flex": 22.0, "shoulder_abd": 65.0, "load_hrs": 15.0, "has_hist": 0}
    },
    {
        "fullname": "Kylian Mbappe",
        "email": "kylian.mbappe@sird.com",
        "sport_type": "Soccer",
        "position": "Forward",
        "age": 25,
        "height": 178,
        "weight": 73,
        "injury_history": "None",
        "training_load": "14 hrs/week",
        "metrics": {"knee_valgus": 6.5, "hip_stab": 90.0, "trunk_lean": 8.0, "landing_flex": 55.0, "asym": 6.0, "com_drift": 0.6, "ankle_inv": 7.0, "lumbar_flex": 12.0, "shoulder_abd": 60.0, "load_hrs": 14.0, "has_hist": 0}
    },
    {
        "fullname": "Simone Biles",
        "email": "simone.biles@sird.com",
        "sport_type": "Gymnastics",
        "position": "All-Around",
        "age": 27,
        "height": 142,
        "weight": 47,
        "injury_history": "Calf tightness",
        "training_load": "22 hrs/week",
        "metrics": {"knee_valgus": 5.2, "hip_stab": 95.0, "trunk_lean": 6.0, "landing_flex": 62.0, "asym": 4.5, "com_drift": 0.4, "ankle_inv": 6.5, "lumbar_flex": 10.0, "shoulder_abd": 130.0, "load_hrs": 22.0, "has_hist": 1}
    },
    {
        "fullname": "Usain Bolt",
        "email": "usain.bolt@sird.com",
        "sport_type": "Track & Field",
        "position": "100m / 200m Sprinter",
        "age": 30,
        "height": 195,
        "weight": 94,
        "injury_history": "Scoliosis related pelvic tilt",
        "training_load": "16 hrs/week",
        "metrics": {"knee_valgus": 8.0, "hip_stab": 78.0, "trunk_lean": 15.0, "landing_flex": 40.0, "asym": 21.0, "com_drift": 1.8, "ankle_inv": 10.0, "lumbar_flex": 26.0, "shoulder_abd": 75.0, "load_hrs": 16.0, "has_hist": 1}
    },
    {
        "fullname": "Giannis Antetokounmpo",
        "email": "giannis.a@sird.com",
        "sport_type": "Basketball",
        "position": "Forward",
        "age": 29,
        "height": 211,
        "weight": 110,
        "injury_history": "Knee hyperextension 2021",
        "training_load": "19 hrs/week",
        "metrics": {"knee_valgus": 13.8, "hip_stab": 70.0, "trunk_lean": 12.5, "landing_flex": 30.0, "asym": 14.5, "com_drift": 1.2, "ankle_inv": 11.0, "lumbar_flex": 20.0, "shoulder_abd": 85.0, "load_hrs": 19.0, "has_hist": 1}
    },
    {
        "fullname": "Novak Djokovic",
        "email": "novak.djokovic@sird.com",
        "sport_type": "Tennis",
        "position": "Singles",
        "age": 31,
        "height": 188,
        "weight": 77,
        "injury_history": "Elbow surgery 2018",
        "training_load": "17 hrs/week",
        "metrics": {"knee_valgus": 6.0, "hip_stab": 92.0, "trunk_lean": 7.5, "landing_flex": 58.0, "asym": 5.5, "com_drift": 0.5, "ankle_inv": 7.5, "lumbar_flex": 11.0, "shoulder_abd": 105.0, "load_hrs": 17.0, "has_hist": 1}
    },
    {
        "fullname": "Megan Rapinoe",
        "email": "megan.rapinoe@sird.com",
        "sport_type": "Soccer",
        "position": "Midfielder",
        "age": 28,
        "height": 168,
        "weight": 60,
        "injury_history": "ACL tear 2015",
        "training_load": "15 hrs/week",
        "metrics": {"knee_valgus": 15.2, "hip_stab": 62.0, "trunk_lean": 17.0, "landing_flex": 26.0, "asym": 19.0, "com_drift": 1.6, "ankle_inv": 13.5, "lumbar_flex": 23.0, "shoulder_abd": 65.0, "load_hrs": 15.0, "has_hist": 1}
    },
    {
        "fullname": "Stephen Curry",
        "email": "stephen.curry@sird.com",
        "sport_type": "Basketball",
        "position": "Point Guard",
        "age": 30,
        "height": 188,
        "weight": 84,
        "injury_history": "Ankle ligament sprains 2012-2014",
        "training_load": "18 hrs/week",
        "metrics": {"knee_valgus": 9.5, "hip_stab": 84.0, "trunk_lean": 10.2, "landing_flex": 48.0, "asym": 9.0, "com_drift": 2.8, "ankle_inv": 17.5, "lumbar_flex": 14.0, "shoulder_abd": 90.0, "load_hrs": 18.0, "has_hist": 1}
    },
    {
        "fullname": "Katie Ledecky",
        "email": "katie.ledecky@sird.com",
        "sport_type": "Swimming",
        "position": "Freestyle",
        "age": 27,
        "height": 183,
        "weight": 73,
        "injury_history": "Shoulder impingement 2020",
        "training_load": "24 hrs/week",
        "metrics": {"knee_valgus": 5.8, "hip_stab": 86.0, "trunk_lean": 8.5, "landing_flex": 50.0, "asym": 7.0, "com_drift": 0.7, "ankle_inv": 8.0, "lumbar_flex": 16.0, "shoulder_abd": 140.0, "load_hrs": 24.0, "has_hist": 1}
    }
]

async def seed_all_12_athletes():
    await Database.connect_db()
    db = Database.db

    logger_msg = []
    print("[+] Starting seeding of 12 realistic demo athletes and processing full app pipeline...")

    # Load ML models
    MLPredictionEngine.load_models()

    for idx, item in enumerate(ATHLETES_DATA, 1):
        athlete_id = f"ATH-{idx:03d}"
        email = item["email"]

        # 1. Create User User Account
        existing_user = await db.users.find_one({"email": email})
        if not existing_user:
            user_doc = {
                "email": email,
                "fullname": item["fullname"],
                "role": "Athlete",
                "password": hash_password("password123"),
                "auth_provider": "local",
                "created_at": datetime.utcnow()
            }
            await db.users.insert_one(user_doc)

        # 2. Create Athlete Profile
        profile_doc = {
            "athlete_id": athlete_id,
            "email": email,
            "fullname": item["fullname"],
            "sport_type": item["sport_type"],
            "position": item["position"],
            "age": item["age"],
            "height": item["height"],
            "weight": item["weight"],
            "injury_history": item["injury_history"],
            "training_load": item["training_load"],
            "assigned_coach": "Alex Ferguson",
            "assigned_physio": "John Carter",
            "created_at": datetime.utcnow()
        }
        await db.athlete_profiles.replace_one({"athlete_id": athlete_id}, profile_doc, upsert=True)

        # 3. Build Feature Vector & Run Actual App Processing Engines
        m = item["metrics"]
        features = [
            m["knee_valgus"], m["hip_stab"], m["trunk_lean"], m["landing_flex"],
            1.8, m["asym"], m["com_drift"], m["shoulder_abd"], m["lumbar_flex"],
            m["ankle_inv"], item["age"], round(item["weight"] / ((item["height"]/100)**2), 1),
            m["load_hrs"], m["has_hist"]
        ]

        # Execute ML Prediction Engine
        predictions = MLPredictionEngine.predict_injury_risks(features)

        # Execute Anomaly Detection Engine
        metrics_dict = {
            "knee_valgus_deg": m["knee_valgus"],
            "asymmetry_ratio": m["asym"],
            "landing_flexion_deg": m["landing_flex"],
            "trunk_lean_deg": m["trunk_lean"],
            "com_drift_cm": m["com_drift"]
        }
        anomalies = AnomalyDetectionEngine.detect_anomalies(metrics_dict)


        # Execute 5-Factor Risk Scoring Model
        overall_scores = RiskScoringEngine.compute_scores(
            predictions, 
            anomalies, 
            {
                "has_injury_history": m["has_hist"], 
                "asymmetry_ratio": m["asym"], 
                "training_load_hrs": m["load_hrs"], 
                "knee_valgus_deg": m["knee_valgus"], 
                "landing_flexion_deg": m["landing_flex"]
            }
        )


        # Execute AI Recommendation Agent (Generative AI + Kinematic Fallback)
        ai_recs = AIRecommendationAgent.generate_ai_recommendations(profile_doc, {"knee_valgus_deg": m["knee_valgus"], "landing_flexion_deg": m["landing_flex"], "asymmetry_ratio": m["asym"], "trunk_lean_deg": m["trunk_lean"]}, predictions)

        # 4. Save Video Analysis Record
        analysis_id = f"ANL-{uuid.uuid4().hex[:6].upper()}"
        video_analysis = {
            "analysis_id": analysis_id,
            "athlete_id": athlete_id,
            "filename": f"{item['fullname'].lower().replace(' ', '_')}_motion_assessment.mp4",
            "upload_date": datetime.utcnow() - timedelta(days=idx),
            "video_url": "http://localhost:8000/storage/processed/sample_analysis.mp4",
            "metrics": {
                "knee_valgus": f"{m['knee_valgus']}°",
                "knee_valgus_deg": m["knee_valgus"],
                "hip_stability": f"{m['hip_stab']}%",
                "trunk_lean": f"{m['trunk_lean']}°",
                "landing_mechanics": f"{m['landing_flex']}° flexion",
                "stride_length": "1.85 m",
                "asymmetry_ratio": f"{m['asym']}%",
                "balance_metrics": f"COM offset {m['com_drift']} cm"
            },
            "scores": overall_scores
        }
        await db.video_analyses.replace_one({"analysis_id": analysis_id}, video_analysis, upsert=True)

        # 5. Save Prediction & AI Recommendation Record
        pred_doc = {
            "report_id": f"REP-{uuid.uuid4().hex[:6].upper()}",
            "athlete_id": athlete_id,
            "injury_predictions": predictions,
            "anomalies": anomalies,
            "overall_scores": overall_scores,
            "recommendations": ai_recs,
            "risk_trend": {"status": "Optimal Alignment" if overall_scores["injury_risk_score"] < 35 else "Warning: Risk Escalation", "delta": "-4% vs baseline"},
            "body_heatmap": {
                "knee_right": int(m["knee_valgus"] * 3.5),
                "knee_left": int(m["knee_valgus"] * 2.5),
                "hamstring": int(m["asym"] * 2.0),
                "ankle": int(m["ankle_inv"] * 3.0),
                "lower_back": int(m["lumbar_flex"] * 2.0),
                "shoulder": int(m["shoulder_abd"] * 0.4)
            },
            "created_at": datetime.utcnow() - timedelta(days=idx)
        }
        await db.predictions.replace_one({"athlete_id": athlete_id}, pred_doc, upsert=True)

        # 6. Save MongoDB Time-Series Telemetry Record
        telemetry_doc = {
            "athlete_id": athlete_id,
            "timestamp": datetime.utcnow() - timedelta(days=idx),
            "joint_angles": {
                "knee_valgus_deg": m["knee_valgus"],
                "hip_stability": m["hip_stab"],
                "trunk_lean_deg": m["trunk_lean"],
                "landing_flexion_deg": m["landing_flex"]
            },
            "scores": overall_scores
        }
        await db.telemetry_timeseries.insert_one(telemetry_doc)

        # 7. Add a Coach/Physio Custom Prescription for each athlete
        custom_rec = {
            "rec_id": f"CUS-{uuid.uuid4().hex[:6].upper()}",
            "athlete_id": athlete_id,
            "prescribed_by": "John Carter",
            "author_role": "Physiotherapist",
            "title": f"{item['sport_type']} Kinetic Rehabilitation Drill",
            "category": "Mobility & Strength",
            "exercise_type": "Custom Drill",
            "priority": "High" if overall_scores["injury_risk_score"] > 40 else "Medium",
            "body_region": "Lower Limb & Core",
            "description": f"Custom rehab routine assigned for {item['fullname']} based on {item['injury_history']}.",
            "duration": "20 mins",
            "frequency": "3x / week",
            "created_at": datetime.utcnow() - timedelta(days=idx)
        }
        await db.custom_recommendations.insert_one(custom_rec)

        print(f"  [+] Seeded & Processed Athlete {idx}/12: {item['fullname']} ({item['sport_type']}) - Risk Score: {overall_scores['injury_risk_score']}%")

    print("\n[+] Successfully seeded and processed all 12 demo athletes!")

    await Database.close_db()

if __name__ == "__main__":
    asyncio.run(seed_all_12_athletes())
