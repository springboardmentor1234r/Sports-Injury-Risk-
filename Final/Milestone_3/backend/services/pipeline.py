import os
import sys
from datetime import datetime, timezone
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

# Decoupled path setup
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
from services.anomaly_detection import AnomalyDetectionEngine
from services.injury_risk_prediction import InjuryRiskPredictionEngine
from services.risk_scoring import RiskScoringEngine
from services.recommendation_engine import RecommendationEngine

async def run_pipeline_stages(session_id: str, db: AsyncIOMotorDatabase):
    """
    Background worker that runs all pipeline stages and updates the status.
    """
    async def set_status(status_str, stage_str, progress_int, message_str, error_str=None):
        return await db["Milestone3PipelineStatus"].update_one(
            {"session_id": session_id},
            {"$set": {
                "session_id": session_id,
                "status": status_str,
                "stage": stage_str,
                "progress": progress_int,
                "message": message_str,
                "error": error_str,
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )

    try:
        # Stage 1: Loading Milestone 2 data
        await set_status("PROCESSING", "loading_m2_data", 10, "Loading Milestone 2 pose, skeleton, and biomechanical parameters.")
        
        session_doc = await db["AnalysisSessions"].find_one({"_id": ObjectId(session_id)})
        if not session_doc:
            raise ValueError("Analysis session not found.")
            
        if session_doc.get("processing_status") != "completed":
            raise ValueError("Milestone 2 analysis is not complete.")

        biomech_doc = await db["Biomechanics"].find_one({"session_id": session_id})
        if not biomech_doc:
            raise ValueError("Biomechanical analysis data is missing. Please complete Milestone 2 analysis first.")

        skel_doc = await db["SkeletonTracking"].find_one({"session_id": session_id})
        
        athlete_id = session_doc.get("athlete_id")
        athlete_doc = None
        try:
            athlete_doc = await db["athletes"].find_one({"_id": ObjectId(athlete_id)})
        except Exception:
            pass
        if not athlete_doc:
            athlete_doc = await db["athletes"].find_one({"athlete_id": athlete_id})
            
        athlete_profile = {}
        if athlete_doc:
            raw_acwr = athlete_doc.get("acwr")
            if raw_acwr is None and athlete_doc.get("training_load"):
                tl = str(athlete_doc.get("training_load")).lower()
                if "high" in tl:
                    raw_acwr = 1.6
                elif "low" in tl:
                    raw_acwr = 0.7
                elif "medium" in tl:
                    raw_acwr = 1.1
            if raw_acwr is not None:
                try:
                    raw_acwr = float(raw_acwr)
                except (ValueError, TypeError):
                    raw_acwr = None

            athlete_profile = {
                "injury_history": str(athlete_doc.get("injury_history") or athlete_doc.get("medical_history") or ""),
                "acwr": raw_acwr
            }

        # Stage 2: Anomaly detection
        await set_status("PROCESSING", "anomaly_detection", 30, "Scanning joint motion ranges for posture anomalies.")
        anom_objects = AnomalyDetectionEngine.detect_anomalies(
            athlete_id=str(athlete_id),
            session_id=session_id,
            video_id=session_doc.get("video_id"),
            biomechanics_data=biomech_doc,
            skeleton_data=skel_doc
        )

        # Stage 3: Injury risk prediction
        await set_status("PROCESSING", "injury_risk_prediction", 50, "Evaluating joint load vectors against injury patterns.")
        pred_objects = InjuryRiskPredictionEngine.predict_injury_risks(
            athlete_id=str(athlete_id),
            session_id=session_id,
            video_id=session_doc.get("video_id"),
            biomechanics_data=biomech_doc,
            skeleton_data=skel_doc,
            anomalies=anom_objects,
            athlete_profile=athlete_profile
        )

        # Stage 4: Weighted risk scoring
        await set_status("PROCESSING", "weighted_risk_scoring", 70, "Computing composite overall risk scoring matrix.")
        score_obj = RiskScoringEngine.calculate_risk_score(
            athlete_id=str(athlete_id),
            session_id=session_id,
            video_id=session_doc.get("video_id"),
            biomechanics_data=biomech_doc,
            skeleton_data=skel_doc,
            anomalies=anom_objects,
            predictions=pred_objects,
            athlete_profile=athlete_profile
        )

        # Stage 5: Recommendation generation
        await set_status("PROCESSING", "recommendation_generation", 85, "Formulating targeted corrective exercise and recovery strategies.")
        rec_objects = RecommendationEngine.generate_recommendations(
            athlete_id=str(athlete_id),
            session_id=session_id,
            anomalies=anom_objects,
            predictions=pred_objects,
            risk_score=score_obj
        )

        # Stage 6: Saving results
        await set_status("PROCESSING", "saving_results", 95, "Persisting calculated intelligence datasets to database.")
        
        # Prevent duplicates
        await db["MovementAnomalies"].delete_many({"session_id": session_id})
        await db["InjuryRiskPredictions"].delete_many({"session_id": session_id})
        await db["RiskScores"].delete_many({"session_id": session_id})
        await db["Recommendations"].delete_many({"session_id": session_id})

        if anom_objects:
            anom_dicts = [a.model_dump(by_alias=True) for a in anom_objects]
            for ad in anom_dicts:
                if "_id" in ad and ad["_id"] is None:
                    del ad["_id"]
            await db["MovementAnomalies"].insert_many(anom_dicts)

        if pred_objects:
            pred_dicts = [p.model_dump(by_alias=True) for p in pred_objects]
            for pd in pred_dicts:
                if "_id" in pd and pd["_id"] is None:
                    del pd["_id"]
            await db["InjuryRiskPredictions"].insert_many(pred_dicts)

        score_dict = score_obj.model_dump(by_alias=True)
        if "_id" in score_dict and score_dict["_id"] is None:
            del score_dict["_id"]
        await db["RiskScores"].insert_one(score_dict)

        if rec_objects:
            rec_dicts = [r.model_dump(by_alias=True) for r in rec_objects]
            for rd in rec_dicts:
                if "_id" in rd and rd["_id"] is None:
                    del rd["_id"]
            await db["Recommendations"].insert_many(rec_dicts)

        # Completed stage
        await set_status("COMPLETED", "completed", 100, "Milestone 3 intelligence pipeline completed successfully.")

    except Exception as e:
        print(f"[PIPELINE ERROR] Run failed: {str(e)}")
        await set_status("FAILED", "completed", 100, f"Pipeline execution failed: {str(e)}", error_str=str(e))


async def get_or_compute_milestone3_results(
    session_id: str,
    db: AsyncIOMotorDatabase
) -> dict:
    """
    Checks if Milestone 3 records exist for a completed session.
    If not, dynamically executes the Milestone 3 pipeline, persists results, and returns.
    """
    # 1. Fetch AnalysisSession
    try:
        session_doc = await db["AnalysisSessions"].find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Session ID format."
        )

    if not session_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis session not found."
        )

    # Handle sessions that are not completed yet
    processing_status = session_doc.get("processing_status")
    if processing_status != "completed":
        return {
            "status": processing_status or "idle",
            "anomalies": [],
            "injury_risks": [],
            "risk_score": None,
            "recommendations": []
        }

    # 2. Check if risk score exists in DB
    risk_score_doc = await db["RiskScores"].find_one({"session_id": session_id})
    if risk_score_doc:
        # Load other collections
        anomalies_cursor = db["MovementAnomalies"].find({"session_id": session_id})
        anomalies_list = await anomalies_cursor.to_list(length=1000)
        
        predictions_cursor = db["InjuryRiskPredictions"].find({"session_id": session_id})
        predictions_list = await predictions_cursor.to_list(length=100)
        
        recs_cursor = db["Recommendations"].find({"session_id": session_id})
        recs_list = await recs_cursor.to_list(length=100)
        
        # Convert _id to string for schemas
        for d in anomalies_list:
            d["_id"] = str(d["_id"])
        for d in predictions_list:
            d["_id"] = str(d["_id"])
        for d in recs_list:
            d["_id"] = str(d["_id"])
        risk_score_doc["_id"] = str(risk_score_doc["_id"])
        
        return {
            "status": "completed",
            "anomalies": anomalies_list,
            "injury_risks": predictions_list,
            "risk_score": risk_score_doc,
            "recommendations": recs_list
        }

    # 3. If missing, compute sync on-the-fly and return
    await run_pipeline_stages(session_id, db)
    
    # Reload results
    risk_score_doc = await db["RiskScores"].find_one({"session_id": session_id})
    anomalies_cursor = db["MovementAnomalies"].find({"session_id": session_id})
    anomalies_list = await anomalies_cursor.to_list(length=1000)
    predictions_cursor = db["InjuryRiskPredictions"].find({"session_id": session_id})
    predictions_list = await predictions_cursor.to_list(length=100)
    recs_cursor = db["Recommendations"].find({"session_id": session_id})
    recs_list = await recs_cursor.to_list(length=100)

    # Convert _id to string for schemas
    if anomalies_list:
        for d in anomalies_list: d["_id"] = str(d["_id"])
    if predictions_list:
        for d in predictions_list: d["_id"] = str(d["_id"])
    if recs_list:
        for d in recs_list: d["_id"] = str(d["_id"])
    if risk_score_doc:
        risk_score_doc["_id"] = str(risk_score_doc["_id"])

    return {
        "status": "completed",
        "anomalies": anomalies_list,
        "injury_risks": predictions_list,
        "risk_score": risk_score_doc,
        "recommendations": recs_list
    }


async def verify_session_permission(
    session_id: str,
    current_user: dict,
    db: AsyncIOMotorDatabase
) -> dict:
    """
    Checks if a session exists, and verifies if current_user has access.
    Coaches and Admins can view any session.
    Athletes can view sessions if:
      - The session was created by them (created_by == current_user email), OR
      - Their athlete profile full_name matches their user account name.
    """
    try:
        session_doc = await db["AnalysisSessions"].find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Session ID format."
        )

    if not session_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis session not found."
        )

    role = current_user.get("role")
    if role == "Admin":
        return session_doc

    current_email = current_user.get("email", "").strip().lower()
    session_created_by = (session_doc.get("created_by") or "").strip().lower()

    # Resolve athlete profile
    athlete_id = session_doc.get("athlete_id")
    athlete_doc = None
    try:
        athlete_doc = await db["athletes"].find_one({"_id": ObjectId(athlete_id)})
    except Exception:
        pass

    if not athlete_doc:
        athlete_doc = await db["athletes"].find_one({"athlete_id": athlete_id})

    if role == "Coach":
        coach_id = str(current_user.get("_id", ""))
        coach_email = current_user.get("email", "").strip().lower()
        coach_name = current_user.get("name", "").strip().lower()
        
        is_owner = (session_created_by and session_created_by == coach_email)
        if athlete_doc:
            ath_coach_id = str(athlete_doc.get("coach_id") or "").strip().lower()
            ath_coach_name = (athlete_doc.get("coach_name") or "").strip().lower()
            ath_created_by = (athlete_doc.get("created_by") or "").strip().lower()
            if (
                (ath_coach_id and ath_coach_id in [coach_id.lower(), coach_email]) or
                (ath_coach_name and ath_coach_name in [coach_name, coach_email]) or
                (ath_created_by and ath_created_by == coach_email)
            ):
                is_owner = True
        
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You are not authorized to view another coach's session data."
            )
        return session_doc

    # Athlete Role
    if current_email and session_created_by and current_email == session_created_by:
        return session_doc

    if not athlete_doc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session's athlete profile could not be verified."
        )

    is_same_name = (
        bool(current_user.get("name")) and
        athlete_doc.get("full_name", "").strip().lower() == current_user.get("name", "").strip().lower()
    )
    is_creator = (
        bool(current_email) and
        (athlete_doc.get("created_by") or "").strip().lower() == current_email
    )
    if not is_same_name and not is_creator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this athlete's session data."
        )

    return session_doc
