import sys
import os
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

class HistoryService:
    @staticmethod
    async def sync_session_to_history(
        athlete_id: str,
        session_id: str,
        db: AsyncIOMotorDatabase
    ) -> dict:
        """
        Extracts a lightweight trend summary of a finished session and records it in AnalysisHistory.
        """
        # 1. Prevent duplicates
        existing_history = await db["AnalysisHistory"].find_one({"session_id": session_id})
        if existing_history:
            existing_history["_id"] = str(existing_history["_id"])
            return existing_history

        # 2. Get session details
        try:
            session_doc = await db["AnalysisSessions"].find_one({"_id": ObjectId(session_id)})
        except Exception:
            raise ValueError("Invalid Session ID format.")

        if not session_doc:
            raise ValueError("Analysis session not found.")

        # 3. Get risk score details
        risk_score_doc = await db["RiskScores"].find_one({"session_id": session_id})
        if not risk_score_doc:
            raise ValueError("Milestone 3 analysis has not been performed on this session.")

        # 4. Pull major anomalies
        anomalies_cursor = db["MovementAnomalies"].find({"session_id": session_id})
        anomalies_list = await anomalies_cursor.to_list(length=100)
        major_anoms = [
            anom.get("anomaly_type") for anom in anomalies_list 
            if anom.get("severity") in ["High", "Critical"] and anom.get("anomaly_type")
        ]

        # 5. Pull major injury risks
        predictions_cursor = db["InjuryRiskPredictions"].find({"session_id": session_id})
        predictions_list = await predictions_cursor.to_list(length=100)
        major_risks = [
            pred.get("injury_type") for pred in predictions_list 
            if pred.get("probability", 0.0) >= 40.0 and pred.get("injury_type")
        ]

        # 6. Build history document
        overall_risk = risk_score_doc.get("overall_injury_risk_score", 0.0)
        history_doc = {
            "_id": ObjectId(),
            "athlete_id": athlete_id,
            "session_id": session_id,
            "analysis_date": session_doc.get("completed_at") or datetime.now(timezone.utc),
            "injury_risk_score": float(overall_risk),
            "risk_category": risk_score_doc.get("risk_category", "Low"),
            "movement_quality_score": float(risk_score_doc.get("movement_quality_score", 100.0 - overall_risk)),
            "athlete_health_score": float(risk_score_doc.get("athlete_health_score", 100.0 - overall_risk)),
            "fatigue_risk_score": float(risk_score_doc.get("score_breakdown", {}).get("fatigue_factor", {}).get("score", 0.0)),
            "major_anomalies": list(set(major_anoms)),
            "major_injury_risks": list(set(major_risks)),
            "created_at": datetime.now(timezone.utc)
        }

        # 7. Persist
        await db["AnalysisHistory"].insert_one(history_doc)
        history_doc["_id"] = str(history_doc["_id"])
        
        return history_doc

    @staticmethod
    async def get_athlete_history(
        athlete_id: str,
        db: AsyncIOMotorDatabase
    ) -> List[dict]:
        """
        Retrieves all historical trend summaries for an athlete, sorted by analysis date ascending.
        """
        # Auto-sync completed sessions with existing risk scores into AnalysisHistory
        sessions_cursor = db["AnalysisSessions"].find({
            "athlete_id": athlete_id,
            "processing_status": "completed"
        })
        completed_sessions = await sessions_cursor.to_list(length=100)
        for sess in completed_sessions:
            s_id = str(sess["_id"])
            exists = await db["AnalysisHistory"].find_one({"session_id": s_id})
            if not exists:
                try:
                    await HistoryService.sync_session_to_history(athlete_id, s_id, db)
                except Exception:
                    pass

        cursor = db["AnalysisHistory"].find({"athlete_id": athlete_id}).sort("analysis_date", 1)
        history_list = await cursor.to_list(length=1000)
        for h in history_list:
            h["_id"] = str(h["_id"])
        return history_list
