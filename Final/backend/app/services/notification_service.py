import sys
import os
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

class NotificationService:
    @staticmethod
    async def generate_notifications(
        athlete_id: str,
        session_id: str,
        db: AsyncIOMotorDatabase
    ) -> List[dict]:
        """
        Scans calculated Milestone 3 telemetry and automatically creates dynamic alert entries in MongoDB.
        """
        # 1. Fetch risk scores
        risk_score_doc = await db["RiskScores"].find_one({"session_id": session_id})
        if not risk_score_doc:
            raise ValueError("Milestone 3 analysis has not been performed on this session.")

        # Check existing notifications for this session to prevent duplicates
        existing_cursor = db["Notifications"].find({"session_id": session_id})
        existing_notifs = await existing_cursor.to_list(length=100)
        existing_types = {n.get("notification_type") for n in existing_notifs}

        notifications = []

        def add_notif(notif_type, title, message, severity):
            if notif_type in existing_types:
                return
            notifications.append({
                "_id": ObjectId(),
                "athlete_id": athlete_id,
                "session_id": session_id,
                "notification_type": notif_type,
                "title": title,
                "message": message,
                "severity": severity,
                "read_status": False,
                "created_at": datetime.now(timezone.utc)
            })

        # Check Overall Risk Category
        score = risk_score_doc.get("overall_injury_risk_score", 0.0)
        cat = risk_score_doc.get("risk_category", "Low")
        
        if cat == "Critical":
            add_notif(
                "Critical risk detected",
                "Critical Injury Risk Detected",
                f"Biomechanical monitoring indicates a Critical injury risk index of {score:.1f}%. Review technique recommendations immediately.",
                "Critical"
            )
        elif cat == "High":
            add_notif(
                "High injury risk detected",
                "High Injury Risk Detected",
                f"Analysis shows an elevated injury risk index of {score:.1f}%. Corrective drills are recommended.",
                "High"
            )

        # Check anomalies
        anomalies_cursor = db["MovementAnomalies"].find({"session_id": session_id})
        anomalies_list = await anomalies_cursor.to_list(length=100)
        high_anoms = [a for a in anomalies_list if a.get("severity") in ["High", "Critical"]]
        if high_anoms:
            joints = ", ".join(list(set([a.get("joint", "Unknown") for a in high_anoms])))
            add_notif(
                "Significant movement anomaly",
                "Posture Anomalies Detected",
                f"Significant anomalies observed during joint flexion ({joints}). Corrective alignment requested.",
                "High"
            )

        # Check fatigue factor
        fatigue_score = risk_score_doc.get("score_breakdown", {}).get("fatigue_factor", {}).get("score", 0.0)
        if fatigue_score >= 50.0:
            add_notif(
                "Increased fatigue",
                "Increased Athlete Fatigue Indicated",
                f"Fatigue markers indicate a stress index of {fatigue_score:.1f}%. Rest and recovery recommended.",
                "Medium"
            )

        # Generic completion alert
        add_notif(
            "New analysis completed",
            "Analysis Completed Successfully",
            "Biomechanical tracking pipeline completed successfully. Athlete intelligence report is ready.",
            "Low"
        )

        # Write generated alerts to database
        if notifications:
            await db["Notifications"].insert_many(notifications)
            for n in notifications:
                n["_id"] = str(n["_id"])

        return notifications

    @staticmethod
    async def get_athlete_notifications(
        athlete_id: str,
        db: AsyncIOMotorDatabase,
        unread_only: bool = True
    ) -> List[dict]:
        """
        Retrieves alert notifications.
        """
        query = {"athlete_id": athlete_id}
        if unread_only:
            query["read_status"] = False

        cursor = db["Notifications"].find(query).sort("created_at", -1)
        notifications_list = await cursor.to_list(length=1000)
        for n in notifications_list:
            n["_id"] = str(n["_id"])
        return notifications_list

    @staticmethod
    async def mark_notification_as_read(
        notification_id: str,
        db: AsyncIOMotorDatabase
    ) -> bool:
        """
        Marks an alert notification as read.
        """
        try:
            res = await db["Notifications"].update_one(
                {"_id": ObjectId(notification_id)},
                {"$set": {"read_status": True}}
            )
            return res.modified_count > 0
        except Exception:
            return False
