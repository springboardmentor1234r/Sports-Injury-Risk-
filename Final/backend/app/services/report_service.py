import sys
import os
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any, Optional

# Add parent path to resolve module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

class ReportService:
    @staticmethod
    async def generate_report(
        athlete_id: str,
        session_id: str,
        db: AsyncIOMotorDatabase
    ) -> dict:
        """
        Gathers completed calculations from Milestone 2 and 3 and persists them into a single report document.
        """
        # 1. Check if report already exists to prevent duplicate generation
        existing_report = await db["AthleteReports"].find_one({"session_id": session_id})
        if existing_report:
            existing_report["_id"] = str(existing_report["_id"])
            return existing_report

        # 2. Retrieve session metadata
        try:
            session_doc = await db["AnalysisSessions"].find_one({"_id": ObjectId(session_id)})
        except Exception:
            raise ValueError("Invalid Session ID format.")

        if not session_doc:
            raise ValueError("Analysis session not found.")

        if session_doc.get("processing_status") != "completed":
            raise ValueError("Milestone 2 analysis is not complete.")

        # 3. Retrieve athlete profile
        athlete_doc = None
        try:
            athlete_doc = await db["athletes"].find_one({"_id": ObjectId(athlete_id)})
        except Exception:
            pass
        if not athlete_doc:
            athlete_doc = await db["athletes"].find_one({"athlete_id": athlete_id})

        if not athlete_doc:
            raise ValueError("Athlete profile not found.")

        # 4. Fetch Milestone 3 outcomes
        risk_score_doc = await db["RiskScores"].find_one({"session_id": session_id})
        if not risk_score_doc:
            raise ValueError("Milestone 3 analysis has not been performed on this session.")

        anomalies_cursor = db["MovementAnomalies"].find({"session_id": session_id})
        anomalies_list = await anomalies_cursor.to_list(length=1000)

        predictions_cursor = db["InjuryRiskPredictions"].find({"session_id": session_id})
        predictions_list = await predictions_cursor.to_list(length=100)

        recs_cursor = db["Recommendations"].find({"session_id": session_id})
        recs_list = await recs_cursor.to_list(length=100)

        # 5. Extract scores and categories
        overall_risk_score = risk_score_doc.get("overall_injury_risk_score", 0.0)
        risk_category = risk_score_doc.get("risk_category", "Low")
        
        # Pull wellness variables
        athlete_health_score = risk_score_doc.get("athlete_health_score", 100.0 - overall_risk_score)
        movement_quality_score = risk_score_doc.get("movement_quality_score", 100.0 - overall_risk_score)
        
        # Biomechanical parameters summary
        biomech_summary = {}
        biomech_doc = await db["Biomechanics"].find_one({"session_id": session_id})
        if biomech_doc and "summary" in biomech_doc:
            biomech_summary = biomech_doc["summary"]

        # Parse specific predictions
        injury_specific_risks = {}
        for pred in predictions_list:
            label = pred.get("injury_type", "Unknown")
            prob = pred.get("probability", 0.0)
            injury_specific_risks[label] = prob

        # Format lists
        clean_anoms = []
        for anom in anomalies_list:
            clean_anoms.append({
                "anomaly_type": anom.get("anomaly_type"),
                "severity": anom.get("severity"),
                "joint": anom.get("joint"),
                "message": anom.get("message")
            })

        clean_recs = []
        for rec in recs_list:
            clean_recs.append({
                "recommendation_type": rec.get("recommendation_type"),
                "title": rec.get("title"),
                "description": rec.get("description"),
                "priority": rec.get("priority")
            })

        data_limitations = risk_score_doc.get("score_breakdown", {}).get("data_limitations", [])

        # 6. Build the final report document
        report_doc = {
            "_id": ObjectId(),
            "athlete_id": athlete_id,
            "session_id": session_id,
            "report_id": str(ObjectId()),
            "overall_injury_risk_score": float(overall_risk_score),
            "risk_category": risk_category,
            "injury_specific_risks": injury_specific_risks,
            "movement_anomalies": clean_anoms,
            "biomechanical_summary": biomech_summary,
            "movement_quality_score": float(movement_quality_score),
            "athlete_health_score": float(athlete_health_score),
            "recommendations": clean_recs,
            "data_limitations": data_limitations,
            "analysis_timestamp": session_doc.get("completed_at") or datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        # 7. Write to database
        await db["AthleteReports"].insert_one(report_doc)
        report_doc["_id"] = str(report_doc["_id"])
        
        return report_doc

    @staticmethod
    async def get_report(
        report_id: str,
        db: AsyncIOMotorDatabase
    ) -> Optional[dict]:
        """
        Retrieves a compiled report from the database using its unique report_id.
        """
        report_doc = await db["AthleteReports"].find_one({"report_id": report_id})
        if report_doc:
            report_doc["_id"] = str(report_doc["_id"])
        return report_doc
