import os
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
from models.injury_risk import InjuryRiskPredictionsDB
from models.anomaly import MovementAnomaliesDB

# Configurable Risk Probability Thresholds
THRESHOLD_RISK_MODERATE = 25.0
THRESHOLD_RISK_HIGH = 50.0
THRESHOLD_RISK_CRITICAL = 75.0

class InjuryRiskPredictionEngine:
    @staticmethod
    def get_risk_level(prob: float) -> str:
        """
        Determines the qualitative risk level based on the probability percentage.
        """
        if prob < THRESHOLD_RISK_MODERATE:
            return "Low"
        elif prob < THRESHOLD_RISK_HIGH:
            return "Moderate"
        elif prob < THRESHOLD_RISK_CRITICAL:
            return "High"
        else:
            return "Critical"

    @staticmethod
    def predict_injury_risks(
        athlete_id: str,
        session_id: str,
        video_id: str,
        biomechanics_data: Dict[str, Any],
        skeleton_data: Optional[Dict[str, Any]] = None,
        anomalies: Optional[List[MovementAnomaliesDB]] = None,
        athlete_profile: Optional[Dict[str, Any]] = None
    ) -> List[InjuryRiskPredictionsDB]:
        """
        Processes biomechanics, skeleton tracking, and detected anomalies to evaluate injury risk.
        Returns a list of InjuryRiskPredictionsDB records for the 6 target categories.
        """
        predictions = []
        anomalies = anomalies or []
        summary = biomechanics_data.get("summary", {})
        
        # Extract common stats safely
        max_valgus_l = summary.get("max_knee_valgus_left", 0.0)
        max_valgus_r = summary.get("max_knee_valgus_right", 0.0)
        landing_flexion = summary.get("landing_flexion_at_impact", 0.0)
        symmetry_idx = summary.get("mean_symmetry_index", 100.0)
        avg_trunk_lean = summary.get("average_trunk_lean", 0.0)
        avg_balance_offset = summary.get("average_balance_offset", 0.0)
        rom_flexion_l = summary.get("max_rom_flexion_left", 0.0)
        rom_flexion_r = summary.get("max_rom_flexion_right", 0.0)
        peak_stride = summary.get("peak_stride_length", 0.0)
        
        # 1. ACL Risk Estimation
        acl_prob = 10.0  # Base risk
        acl_metrics = []
        acl_evidence = {}

        # Check peak knee valgus
        peak_valgus = max(max_valgus_l, max_valgus_r)
        if peak_valgus > 10.0:
            val = min(35.0, (peak_valgus - 10.0) * 4.0)
            acl_prob += val
            acl_metrics.append(f"Excessive Knee Valgus (Peak {peak_valgus:.1f}°)")
            acl_evidence["peak_knee_valgus"] = peak_valgus
            
        # Check landing stiffness (flexion < 30)
        if 0.0 < landing_flexion < 30.0:
            acl_prob += 25.0
            acl_metrics.append(f"Stiff Landing Impact Flexion ({landing_flexion:.1f}°)")
            acl_evidence["landing_flexion"] = landing_flexion

        # Check asymmetry in landing or valgus
        if symmetry_idx < 90.0:
            acl_prob += 15.0
            acl_metrics.append(f"Lower Limb Asymmetry (Index {symmetry_idx:.1f}%)")
            acl_evidence["symmetry_index"] = symmetry_idx

        # Check anomalies
        valgus_anoms = [a for a in anomalies if a.anomaly_type == "knee_valgus"]
        if valgus_anoms:
            acl_prob += 15.0
            acl_metrics.append(f"{len(valgus_anoms)} Knee Valgus Anomaly Flags")
            acl_evidence["valgus_anomaly_count"] = len(valgus_anoms)

        acl_prob = min(95.0, acl_prob)
        acl_level = InjuryRiskPredictionEngine.get_risk_level(acl_prob)
        acl_explanation = (
            f"Elevated ACL injury risk estimated at {acl_prob:.1f}% ({acl_level} Risk). "
            f"Key contributors: {', '.join(acl_metrics) if acl_metrics else 'None (Minimal baseline)'}."
        )
        predictions.append(InjuryRiskPredictionsDB(
            athlete_id=athlete_id,
            session_id=session_id,
            video_id=video_id,
            injury_type="ACL",
            probability=round(acl_prob, 2),
            risk_level=acl_level,
            evidence=acl_evidence,
            explanation=acl_explanation,
            contributing_metrics=acl_metrics
        ))

        # 2. Hamstring Risk Estimation
        ham_prob = 10.0
        ham_metrics = []
        ham_evidence = {}

        # Flexion range offset (Left vs Right extension difference)
        rom_diff = abs(rom_flexion_l - rom_flexion_r)
        if rom_diff > 12.0:
            ham_prob += min(30.0, (rom_diff - 12.0) * 3.0)
            ham_metrics.append(f"Left/Right Flexion ROM Discrepancy ({rom_diff:.1f}°)")
            ham_evidence["rom_difference"] = rom_diff

        # High asymmetry
        if symmetry_idx < 90.0:
            ham_prob += 20.0
            ham_metrics.append(f"Symmetry Index Deviation ({symmetry_idx:.1f}%)")
            ham_evidence["symmetry_index"] = symmetry_idx

        # Check peak joint velocities (e.g. foot/ankle speed showing dynamic loading)
        has_speed_anomaly = False
        if skeleton_data and skeleton_data.get("frames"):
            for sf in skeleton_data["frames"]:
                vels = sf.get("joint_velocities", {})
                for joint, val in vels.items():
                    if "ANKLE" in joint or "KNEE" in joint:
                        if val > 8.0:
                            has_speed_anomaly = True
                            
        if has_speed_anomaly:
            ham_prob += 15.0
            ham_metrics.append("High Joint Acceleration/Velocity Loading")
            ham_evidence["dynamic_sprint_load"] = True

        # Check anomalies
        asym_anoms = [a for a in anomalies if a.anomaly_type == "movement_asymmetry"]
        if asym_anoms:
            ham_prob += 15.0
            ham_metrics.append("Movement Asymmetry Anomalies Detected")
            ham_evidence["asymmetry_anomalies_count"] = len(asym_anoms)

        # Injury History (from profile)
        if athlete_profile and athlete_profile.get("injury_history"):
            hist = athlete_profile["injury_history"]
            if "hamstring" in hist.lower() or "thigh" in hist.lower():
                ham_prob += 20.0
                ham_metrics.append("Previous Hamstring Injury History")
                ham_evidence["injury_history"] = "hamstring"

        ham_prob = min(95.0, ham_prob)
        ham_level = InjuryRiskPredictionEngine.get_risk_level(ham_prob)
        ham_explanation = (
            f"Hamstring strain risk estimated at {ham_prob:.1f}% ({ham_level} Risk). "
            f"Key factors: {', '.join(ham_metrics) if ham_metrics else 'None (Minimal baseline)'}."
        )
        predictions.append(InjuryRiskPredictionsDB(
            athlete_id=athlete_id,
            session_id=session_id,
            video_id=video_id,
            injury_type="Hamstring",
            probability=round(ham_prob, 2),
            risk_level=ham_level,
            evidence=ham_evidence,
            explanation=ham_explanation,
            contributing_metrics=ham_metrics
        ))

        # 3. Ankle Sprain Risk Estimation
        ankle_prob = 10.0
        ankle_metrics = []
        ankle_evidence = {}

        # Balance Offset (higher balance offset indicates unstable postural control)
        if avg_balance_offset > 0.08:
            val = min(35.0, (avg_balance_offset - 0.08) * 300.0)
            ankle_prob += val
            ankle_metrics.append(f"Excessive Balance Center-of-Mass Offset ({avg_balance_offset:.3f})")
            ankle_evidence["balance_offset"] = avg_balance_offset

        # Check landing stiffness (high landing impact transmits force to ankle joints)
        if 0.0 < landing_flexion < 30.0:
            ankle_prob += 15.0
            ankle_metrics.append(f"Stiff Landing Flexion ({landing_flexion:.1f}°)")

        # Ankle roll or velocity anomalies
        ankle_anoms = [a for a in anomalies if a.anomaly_type == "velocity_anomaly" and "ANKLE" in a.affected_joint]
        if ankle_anoms:
            ankle_prob += 20.0
            ankle_metrics.append("Ankle Joint Kinematic Acceleration Spikes")
            ankle_evidence["ankle_anomalies_count"] = len(ankle_anoms)

        # Injury History
        if athlete_profile and athlete_profile.get("injury_history"):
            hist = athlete_profile["injury_history"]
            if "ankle" in hist.lower() or "sprain" in hist.lower():
                ankle_prob += 20.0
                ankle_metrics.append("Previous Ankle Injury History")
                ankle_evidence["injury_history"] = "ankle"

        ankle_prob = min(95.0, ankle_prob)
        ankle_level = InjuryRiskPredictionEngine.get_risk_level(ankle_prob)
        ankle_explanation = (
            f"Ankle sprain / instability risk estimated at {ankle_prob:.1f}% ({ankle_level} Risk). "
            f"Key factors: {', '.join(ankle_metrics) if ankle_metrics else 'None (Minimal baseline)'}."
        )
        predictions.append(InjuryRiskPredictionsDB(
            athlete_id=athlete_id,
            session_id=session_id,
            video_id=video_id,
            injury_type="Ankle Sprain",
            probability=round(ankle_prob, 2),
            risk_level=ankle_level,
            evidence=ankle_evidence,
            explanation=ankle_explanation,
            contributing_metrics=ankle_metrics
        ))

        # 4. Shoulder Injury Risk Estimation
        shoulder_prob = 5.0  # Decoupled upper body baseline
        shoulder_metrics = []
        shoulder_evidence = {}

        # Look for shoulder joint anomalies in skeleton tracking data
        shoulder_anoms = [a for a in anomalies if "SHOULDER" in a.affected_joint or "ARM" in a.affected_joint]
        if shoulder_anoms:
            shoulder_prob += 30.0
            shoulder_metrics.append(f"Upper Limb Acceleration Anomalies ({len(shoulder_anoms)} counts)")
            shoulder_evidence["shoulder_anomalies_count"] = len(shoulder_anoms)
        
        # Check asymmetry in shoulder height if available in joint velocities
        shoulder_vel_diff = 0.0
        if skeleton_data and skeleton_data.get("frames"):
            sh_l_vels = []
            sh_r_vels = []
            for sf in skeleton_data["frames"]:
                vels = sf.get("joint_velocities", {})
                if "LEFT_SHOULDER" in vels:
                    sh_l_vels.append(vels["LEFT_SHOULDER"])
                if "RIGHT_SHOULDER" in vels:
                    sh_r_vels.append(vels["RIGHT_SHOULDER"])
            if sh_l_vels and sh_r_vels:
                avg_l = sum(sh_l_vels) / len(sh_l_vels)
                avg_r = sum(sh_r_vels) / len(sh_r_vels)
                shoulder_vel_diff = abs(avg_l - avg_r)
                if shoulder_vel_diff > 1.5:
                    shoulder_prob += 20.0
                    shoulder_metrics.append(f"Shoulder Dynamic Asymmetry (Diff {shoulder_vel_diff:.2f})")
                    shoulder_evidence["shoulder_velocity_diff"] = shoulder_vel_diff

        # If no shoulder metrics are found in skeleton tracking either, mark as unavailable
        if not shoulder_metrics:
            shoulder_explanation = (
                "Shoulder injury risk is currently at a Low baseline (5.0%). "
                "Note: Upper body biomechanical tracking was not active / is unavailable in this video session."
            )
            shoulder_evidence["tracking_active"] = False
        else:
            shoulder_evidence["tracking_active"] = True
            shoulder_prob = min(90.0, shoulder_prob)
            shoulder_level = InjuryRiskPredictionEngine.get_risk_level(shoulder_prob)
            shoulder_explanation = (
                f"Shoulder dynamic load risk estimated at {shoulder_prob:.1f}% ({shoulder_level} Risk). "
                f"Key factors: {', '.join(shoulder_metrics)}."
            )

        shoulder_level = InjuryRiskPredictionEngine.get_risk_level(shoulder_prob)
        predictions.append(InjuryRiskPredictionsDB(
            athlete_id=athlete_id,
            session_id=session_id,
            video_id=video_id,
            injury_type="Shoulder",
            probability=round(shoulder_prob, 2),
            risk_level=shoulder_level,
            evidence=shoulder_evidence,
            explanation=shoulder_explanation,
            contributing_metrics=shoulder_metrics
        ))

        # 5. Lower Back Injury Risk Estimation
        back_prob = 10.0
        back_metrics = []
        back_evidence = {}

        # Trunk Lean (major indicator of lumbar shear force)
        if avg_trunk_lean > 15.0:
            val = min(35.0, (avg_trunk_lean - 15.0) * 3.0)
            back_prob += val
            back_metrics.append(f"Excessive Average Trunk Lean ({avg_trunk_lean:.1f}°)")
            back_evidence["average_trunk_lean"] = avg_trunk_lean

        # Balance / Posture instability
        if avg_balance_offset > 0.08:
            back_prob += 15.0
            back_metrics.append(f"Postural Balance Offset ({avg_balance_offset:.3f})")
            back_evidence["balance_offset"] = avg_balance_offset

        # Trunk lean anomalies
        lean_anoms = [a for a in anomalies if a.anomaly_type == "excessive_trunk_lean"]
        if lean_anoms:
            back_prob += 20.0
            back_metrics.append("Severe Trunk Postural Deviation Anomalies")
            back_evidence["trunk_anomalies_count"] = len(lean_anoms)

        # Injury History
        if athlete_profile and athlete_profile.get("injury_history"):
            hist = athlete_profile["injury_history"]
            if "back" in hist.lower() or "spine" in hist.lower() or "lumbar" in hist.lower():
                back_prob += 20.0
                back_metrics.append("Previous Lower Back Injury History")
                back_evidence["injury_history"] = "lower back"

        back_prob = min(95.0, back_prob)
        back_level = InjuryRiskPredictionEngine.get_risk_level(back_prob)
        back_explanation = (
            f"Lower back (lumbar load) injury risk estimated at {back_prob:.1f}% ({back_level} Risk). "
            f"Key factors: {', '.join(back_metrics) if back_metrics else 'None (Minimal baseline)'}."
        )
        predictions.append(InjuryRiskPredictionsDB(
            athlete_id=athlete_id,
            session_id=session_id,
            video_id=video_id,
            injury_type="Lower Back",
            probability=round(back_prob, 2),
            risk_level=back_level,
            evidence=back_evidence,
            explanation=back_explanation,
            contributing_metrics=back_metrics
        ))

        # 6. Overuse Injury Risk Estimation
        overuse_prob = 10.0
        overuse_metrics = []
        overuse_evidence = {}

        # Fatigue anomaly (trunk lean increase)
        fatigue_anoms = [a for a in anomalies if a.anomaly_type == "fatigue_monitoring"]
        if fatigue_anoms:
            overuse_prob += 25.0
            overuse_metrics.append("Fatigue-Related Kinematic Degradation")
            overuse_evidence["fatigue_anomaly"] = True

        # Performance decline (stride length decrease)
        decline_anoms = [a for a in anomalies if a.anomaly_type == "performance_decline"]
        if decline_anoms:
            overuse_prob += 25.0
            overuse_metrics.append("Intra-session Performance Decline (Stride Compression)")
            overuse_evidence["performance_decline"] = True

        # High cumulative volume / total frames (session duration)
        num_frames = len(biomechanics_data.get("frames", []))
        if num_frames > 200:  # Long session
            overuse_prob += 15.0
            overuse_metrics.append(f"High Session Repetitive Load Count ({num_frames} frames)")
            overuse_evidence["frame_count"] = num_frames

        # Cumulative Training Load Indicators (from profile e.g. ACWR - Acute Chronic Workload Ratio)
        if athlete_profile and athlete_profile.get("acwr"):
            acwr = athlete_profile["acwr"]
            if acwr > 1.5 or acwr < 0.8:
                overuse_prob += 20.0
                overuse_metrics.append(f"Unstable Training Load Ratio (ACWR {acwr:.2f})")
                overuse_evidence["acwr"] = acwr

        overuse_prob = min(95.0, overuse_prob)
        overuse_level = InjuryRiskPredictionEngine.get_risk_level(overuse_prob)
        overuse_explanation = (
            f"Overuse / fatigue injury risk estimated at {overuse_prob:.1f}% ({overuse_level} Risk). "
            f"Key factors: {', '.join(overuse_metrics) if overuse_metrics else 'None (Minimal baseline)'}."
        )
        predictions.append(InjuryRiskPredictionsDB(
            athlete_id=athlete_id,
            session_id=session_id,
            video_id=video_id,
            injury_type="Overuse",
            probability=round(overuse_prob, 2),
            risk_level=overuse_level,
            evidence=overuse_evidence,
            explanation=overuse_explanation,
            contributing_metrics=overuse_metrics
        ))

        return predictions
