import os
from datetime import datetime, timezone
from typing import Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

# Import database models
from app.milestone2.models.biomechanics import BiomechanicsDB, FrameBiomechanicsData, BiomechanicsSummary

# Import modular calculation scripts
from app.milestone2.services.analysis.joint_angles import compute_frame_angles
from app.milestone2.services.analysis.range_of_motion import compute_progressive_rom
from app.milestone2.services.analysis.balance import calculate_balance_offset
from app.milestone2.services.analysis.posture import compute_posture_metrics
from app.milestone2.services.analysis.symmetry import evaluate_frame_symmetry
from app.milestone2.services.analysis.landing import detect_landing_impact_frame, calculate_landing_flexion
from app.milestone2.services.analysis.stride import calculate_step_separation, calculate_peak_stride
from app.milestone2.services.skeleton_tracking import SkeletonTrackingService

class BiomechanicalAnalysisService:
    @staticmethod
    async def run_full_analysis(
        session_id: str,
        video_id: str,
        db: AsyncIOMotorDatabase
    ):
        """
        Orchestrates Pose -> SkeletonTracking -> Biomechanics calculation pipeline.
        Saves resulting data to separate collections and updates session linkages.
        """
        try:
            # 1. Fetch Pose Analysis
            pose_doc = await db["PoseAnalysis"].find_one({"video_id": video_id})
            if not pose_doc:
                raise RuntimeError("Pose Estimation coordinates missing for this video.")

            pose_frames = pose_doc.get("frames", [])
            if not pose_frames:
                raise RuntimeError("Pose Estimation contains no frame coordinates.")

            # 2. Run Skeleton Tracking
            print(f"[PIPELINE LOG] SkeletonTracking processing started for session: {session_id}")
            tracking_data = SkeletonTrackingService.process_tracking(
                pose_doc, session_id, video_id
            )
            
            # Delete old tracking document if exists to prevent duplicates
            await db["SkeletonTracking"].delete_many({"session_id": session_id})
            
            if "_id" in tracking_data and tracking_data["_id"] is None:
                del tracking_data["_id"]
                
            track_result = await db["SkeletonTracking"].insert_one(tracking_data)
            tracking_id = str(track_result.inserted_id)
            print(f"[PIPELINE LOG] SkeletonTracking completed.")

            # 3. Calculate Biomechanical Metrics Frame-by-Frame
            print(f"[PIPELINE LOG] Biomechanics calculation started.")
            biomech_frames = []
            historical_angles = []
            
            # Extract raw frame landmarks coordinates
            frames_landmarks_list = [f["landmarks"] for f in pose_frames]

            for idx, pf in enumerate(pose_frames):
                frame_num = pf["frame_number"]
                timestamp = pf["timestamp"]
                landmarks = pf["landmarks"]
                
                # Map names to coords for calculations lookup
                lms_map = {lm["name"]: lm for lm in landmarks}
                
                # A. Joint Angles
                angles = compute_frame_angles(lms_map)
                
                # B. Range of Motion (progressive)
                rom = compute_progressive_rom(historical_angles, angles)
                historical_angles.append(angles)
                
                # C. Balance center of mass offset
                balance_offset = calculate_balance_offset(lms_map)
                
                # D. Posture offsets (lean and tilt)
                posture = compute_posture_metrics(lms_map)
                
                # E. Symmetry percentage
                symmetry = evaluate_frame_symmetry(angles)
                
                # F. Step separation
                step_sep = calculate_step_separation(lms_map)
                
                biomech_frames.append(FrameBiomechanicsData(
                    frame_number=frame_num,
                    timestamp=timestamp,
                    joint_angles=angles,
                    rom=rom,
                    balance_offset=balance_offset,
                    trunk_lean=posture.get("trunk_lean", 0.0),
                    symmetry_difference=symmetry,
                    landing_angle=None,  # Handled in post-processing session details
                    stride_length=step_sep
                ))

            # 4. Run Post-Processing Session Calculations
            # A. Landing Touchdown Flexion
            impact_frame_idx = detect_landing_impact_frame(frames_landmarks_list)
            landing_knee_flexion = 0.0
            if impact_frame_idx < len(biomech_frames):
                impact_angles = biomech_frames[impact_frame_idx].joint_angles
                landing_knee_flexion = calculate_landing_flexion(impact_angles)
                # Assign landing flexion values back to the touchdown frame
                biomech_frames[impact_frame_idx].landing_angle = landing_knee_flexion

            # B. Peak Stride Length
            peak_stride = calculate_peak_stride(frames_landmarks_list)
            for f in biomech_frames:
                f.stride_length = peak_stride  # Stride length represents the peak session metric

            # 5. Compile Session Summary Peak Values
            knee_flexion_lefts = [f.joint_angles.get("knee_flexion_left", 0.0) for f in biomech_frames]
            knee_flexion_rights = [f.joint_angles.get("knee_flexion_right", 0.0) for f in biomech_frames]
            knee_valgus_lefts = [f.joint_angles.get("knee_valgus_left", 0.0) for f in biomech_frames]
            knee_valgus_rights = [f.joint_angles.get("knee_valgus_right", 0.0) for f in biomech_frames]
            trunk_leans = [f.trunk_lean for f in biomech_frames]
            balance_offsets = [abs(f.balance_offset) for f in biomech_frames]
            symmetries = [f.symmetry_difference for f in biomech_frames]

            summary = BiomechanicsSummary(
                max_knee_flexion_left=max(knee_flexion_lefts) if knee_flexion_lefts else 0.0,
                max_knee_flexion_right=max(knee_flexion_rights) if knee_flexion_rights else 0.0,
                max_knee_valgus_left=max(knee_valgus_lefts) if knee_valgus_lefts else 0.0,
                max_knee_valgus_right=max(knee_valgus_rights) if knee_valgus_rights else 0.0,
                average_trunk_lean=round(sum(trunk_leans)/len(trunk_leans), 2) if trunk_leans else 0.0,
                average_balance_offset=round(sum(balance_offsets)/len(balance_offsets), 4) if balance_offsets else 0.0,
                mean_symmetry_index=round(sum(symmetries)/len(symmetries), 2) if symmetries else 100.0,
                max_rom_flexion_left=max([f.rom.get("knee_flexion_left", {}).get("max", 0.0) - f.rom.get("knee_flexion_left", {}).get("min", 0.0) for f in biomech_frames]) if biomech_frames else 0.0,
                max_rom_flexion_right=max([f.rom.get("knee_flexion_right", {}).get("max", 0.0) - f.rom.get("knee_flexion_right", {}).get("min", 0.0) for f in biomech_frames]) if biomech_frames else 0.0,
                peak_stride_length=peak_stride,
                landing_flexion_at_impact=landing_knee_flexion
            )

            # 6. Save Biomechanics data to MongoDB
            biomech_doc = BiomechanicsDB(
                session_id=session_id,
                video_id=video_id,
                frames=biomech_frames,
                summary=summary
            )
            
            # Delete old biomechanics document if exists
            await db["Biomechanics"].delete_many({"session_id": session_id})
            
            biomech_dict = biomech_doc.model_dump(by_alias=True)
            if "_id" in biomech_dict and biomech_dict["_id"] is None:
                del biomech_dict["_id"]
                
            biomech_result = await db["Biomechanics"].insert_one(biomech_dict)
            biomech_id = str(biomech_result.inserted_id)
            print(f"[PIPELINE LOG] Biomechanics completed and saved.")

            # 7. Update Session Linkages and Status
            await db["AnalysisSessions"].update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {
                    "pose_analysis_id": str(pose_doc["_id"]),
                    "skeleton_tracking_id": tracking_id,
                    "biomechanics_id": biomech_id,
                    "processing_status": "completed",
                    "error_message": None
                }}
            )
            
            # Update video status to completed
            await db["Videos"].update_one(
                {"_id": ObjectId(video_id)},
                {"$set": {"status": "completed"}}
            )
            print(f"[PIPELINE LOG] Analysis completed successfully.")

        except Exception as e:
            # Mark session as failed
            await db["AnalysisSessions"].update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {
                    "processing_status": "failed",
                    "error_message": str(e)
                }}
            )
            # Mark video status as failed
            await db["Videos"].update_one(
                {"_id": ObjectId(video_id)},
                {"$set": {"status": "failed"}}
            )
            print(f"[PIPELINE LOG] Analysis failed: {e}")
            raise
