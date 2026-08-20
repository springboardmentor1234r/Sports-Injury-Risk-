import os
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Add milestone3 backend path dynamically if needed, though parent import can also resolve
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
from models.anomaly import MovementAnomaliesDB

# Configurable Thresholds for Biomechanical Analysis (decoupled from Milestone 2 config to ensure complete isolation)
THRESHOLD_NORMAL_KNEE_VALGUS = float(os.getenv("BIOMECH_NORMAL_KNEE_VALGUS", "10.0"))
THRESHOLD_NORMAL_TRUNK_LEAN = float(os.getenv("BIOMECH_NORMAL_TRUNK_LEAN", "15.0"))
THRESHOLD_NORMAL_SYMMETRY_RATIO = float(os.getenv("BIOMECH_NORMAL_SYMMETRY_RATIO", "90.0"))
THRESHOLD_NORMAL_LANDING_ANGLE = float(os.getenv("BIOMECH_NORMAL_LANDING_ANGLE", "30.0"))
THRESHOLD_NORMAL_BALANCE_DEVIATION = float(os.getenv("BIOMECH_NORMAL_BALANCE_DEVIATION", "0.08"))

class AnomalyDetectionEngine:
    @staticmethod
    def classify_severity(deviation: float, base_threshold: float) -> str:
        """
        Classifies the severity based on the deviation magnitude.
        Levels: Low, Moderate, High, Critical.
        """
        if deviation <= 0:
            return "Low"
        
        ratio = deviation / base_threshold
        if ratio <= 0.25:
            return "Low"
        elif ratio <= 0.5:
            return "Moderate"
        elif ratio <= 0.75:
            return "High"
        else:
            return "Critical"

    @staticmethod
    def detect_anomalies(
        athlete_id: str,
        session_id: str,
        video_id: str,
        biomechanics_data: Dict[str, Any],
        skeleton_data: Optional[Dict[str, Any]] = None
    ) -> List[MovementAnomaliesDB]:
        """
        Scans Biomechanics and Skeleton data to find movement quality anomalies.
        Returns a list of populated and validated MovementAnomaliesDB instances.
        """
        anomalies = []
        frames = biomechanics_data.get("frames", [])
        if not frames:
            return anomalies

        # 1. Excessive Knee Valgus Left/Right
        valgus_left_anomalies = []
        valgus_right_anomalies = []
        for f in frames:
            frame_num = f.get("frame_number", 0)
            angles = f.get("joint_angles", {})
            valgus_l = angles.get("knee_valgus_left", 0.0)
            valgus_r = angles.get("knee_valgus_right", 0.0)

            # Left valgus
            if valgus_l > THRESHOLD_NORMAL_KNEE_VALGUS:
                valgus_left_anomalies.append({
                    "frame": frame_num,
                    "val": valgus_l,
                    "joint": "Left Knee"
                })
            # Right valgus
            if valgus_r > THRESHOLD_NORMAL_KNEE_VALGUS:
                valgus_right_anomalies.append({
                    "frame": frame_num,
                    "val": valgus_r,
                    "joint": "Right Knee"
                })

        # Group and deduplicate valgus anomalies
        anomalies.extend(AnomalyDetectionEngine._group_and_deduplicate(
            valgus_left_anomalies, athlete_id, session_id, video_id,
            "Excessive Knee Valgus", "knee_valgus", "Left Knee", THRESHOLD_NORMAL_KNEE_VALGUS
        ))
        anomalies.extend(AnomalyDetectionEngine._group_and_deduplicate(
            valgus_right_anomalies, athlete_id, session_id, video_id,
            "Excessive Knee Valgus", "knee_valgus", "Right Knee", THRESHOLD_NORMAL_KNEE_VALGUS
        ))

        # 2. Abnormal Trunk Lean
        trunk_lean_anomalies = []
        for f in frames:
            frame_num = f.get("frame_number", 0)
            lean = f.get("trunk_lean", 0.0)
            if lean > THRESHOLD_NORMAL_TRUNK_LEAN:
                trunk_lean_anomalies.append({
                    "frame": frame_num,
                    "val": lean,
                    "joint": "Trunk"
                })

        anomalies.extend(AnomalyDetectionEngine._group_and_deduplicate(
            trunk_lean_anomalies, athlete_id, session_id, video_id,
            "Excessive Trunk Lean", "excessive_trunk_lean", "Trunk", THRESHOLD_NORMAL_TRUNK_LEAN
        ))

        # 3. Left/Right Movement Asymmetry
        asymmetry_anomalies = []
        for f in frames:
            frame_num = f.get("frame_number", 0)
            symmetry_idx = f.get("symmetry_difference", 100.0)
            # Evaluate asymmetry gap: higher symmetry diff means lower symmetry
            dev = 100.0 - symmetry_idx
            allowed_gap = 100.0 - THRESHOLD_NORMAL_SYMMETRY_RATIO
            if dev > allowed_gap:
                asymmetry_anomalies.append({
                    "frame": frame_num,
                    "val": dev,
                    "joint": "Bilateral Limbs"
                })

        anomalies.extend(AnomalyDetectionEngine._group_and_deduplicate(
            asymmetry_anomalies, athlete_id, session_id, video_id,
            "Movement Asymmetry Inconsistency", "movement_asymmetry", "Bilateral Limbs", 100.0 - THRESHOLD_NORMAL_SYMMETRY_RATIO
        ))

        # 4. Landing Abnormality (Touchdown Stiff Knee landing)
        landing_anomalies = []
        for f in frames:
            frame_num = f.get("frame_number", 0)
            landing_angle = f.get("landing_angle")
            if landing_angle is not None and landing_angle < THRESHOLD_NORMAL_LANDING_ANGLE:
                landing_anomalies.append({
                    "frame": frame_num,
                    "val": landing_angle,
                    "joint": "Knee Landing flexion"
                })

        # Process landing stiffness anomalies (lower is worse)
        for la in landing_anomalies:
            dev = THRESHOLD_NORMAL_LANDING_ANGLE - la["val"]
            severity = AnomalyDetectionEngine.classify_severity(dev, THRESHOLD_NORMAL_LANDING_ANGLE)
            desc = f"Landing stiffness detected: observed flexion {la['val']:.1f}°, expected at least {THRESHOLD_NORMAL_LANDING_ANGLE}°."
            anomalies.append(MovementAnomaliesDB(
                athlete_id=athlete_id,
                session_id=session_id,
                video_id=video_id,
                anomaly_type="landing_abnormality",
                frame_number=la["frame"],
                severity=severity,
                affected_joint="Knee",
                observed_value=la["val"],
                expected_value=THRESHOLD_NORMAL_LANDING_ANGLE,
                description=desc
            ))

        # 5. Sudden Velocity/Acceleration Changes
        if skeleton_data and skeleton_data.get("frames"):
            skel_frames = skeleton_data.get("frames", [])
            velocity_anomalies = []
            
            for sf in skel_frames:
                frame_num = sf.get("frame_number", 0)
                accels = sf.get("joint_accelerations", {})
                for joint, acc in accels.items():
                    # Accelerations greater than 8.0 units/s^2 are flagged
                    if abs(acc) > 8.0:
                        velocity_anomalies.append({
                            "frame": frame_num,
                            "val": abs(acc),
                            "joint": joint
                        })

            joints_represented = set(a["joint"] for a in velocity_anomalies)
            for j in joints_represented:
                j_anoms = [a for a in velocity_anomalies if a["joint"] == j]
                anomalies.extend(AnomalyDetectionEngine._group_and_deduplicate(
                    j_anoms, athlete_id, session_id, video_id,
                    f"Sudden {j} Acceleration Spike", "velocity_anomaly", j, 8.0
                ))

        # 6. Fatigue-Related Movement Changes
        # Detect degradation by comparing average lean of first 20% vs last 20% of frames
        if len(frames) >= 60:
            split = len(frames) // 5
            first_segment = frames[:split]
            last_segment = frames[-split:]
            
            avg_lean_first = sum(f.get("trunk_lean", 0.0) for f in first_segment) / split
            avg_lean_last = sum(f.get("trunk_lean", 0.0) for f in last_segment) / split
            
            if avg_lean_last - avg_lean_first > 5.0:
                desc = f"Fatigue-related posture drift: trunk lean increased from average {avg_lean_first:.1f}° to {avg_lean_last:.1f}°."
                anomalies.append(MovementAnomaliesDB(
                    athlete_id=athlete_id,
                    session_id=session_id,
                    video_id=video_id,
                    anomaly_type="fatigue_monitoring",
                    frame_number=frames[-1].get("frame_number", 0),
                    severity="Moderate" if (avg_lean_last - avg_lean_first < 8.0) else "High",
                    affected_joint="Trunk",
                    observed_value=avg_lean_last,
                    expected_value=avg_lean_first,
                    description=desc
                ))

        # 7. Performance Decline Patterns
        # Stride length decline
        valid_strides = [f.get("stride_length") for f in frames if f.get("stride_length") is not None]
        if len(valid_strides) >= 3:
            first_stride = valid_strides[0]
            last_stride = valid_strides[-1]
            if last_stride < first_stride * 0.85:
                desc = f"Stride length compression: stride length decreased from initial {first_stride:.2f}m to {last_stride:.2f}m."
                anomalies.append(MovementAnomaliesDB(
                    athlete_id=athlete_id,
                    session_id=session_id,
                    video_id=video_id,
                    anomaly_type="performance_decline",
                    frame_number=frames[-1].get("frame_number", 0),
                    severity="Moderate",
                    affected_joint="Stride",
                    observed_value=last_stride,
                    expected_value=first_stride,
                    description=desc
                ))

        return anomalies

    @staticmethod
    def _group_and_deduplicate(
        frame_anomalies: List[Dict[str, Any]],
        athlete_id: str,
        session_id: str,
        video_id: str,
        display_name: str,
        anomaly_type: str,
        joint_name: str,
        threshold: float
    ) -> List[MovementAnomaliesDB]:
        """
        Groups consecutive frames and retains the frame with peak deviation.
        """
        grouped_results = []
        if not frame_anomalies:
            return grouped_results

        # Group consecutive frames
        blocks = []
        current_block = [frame_anomalies[0]]
        
        for a in frame_anomalies[1:]:
            if a["frame"] == current_block[-1]["frame"] + 1:
                current_block.append(a)
            else:
                blocks.append(current_block)
                current_block = [a]
        blocks.append(current_block)

        # Process each block to find peak deviation
        for block in blocks:
            peak = max(block, key=lambda x: x["val"])
            dev = peak["val"] - threshold
            severity = AnomalyDetectionEngine.classify_severity(dev, threshold)
            
            desc = f"{display_name} detected on {joint_name}: observed {peak['val']:.1f}°, reference threshold {threshold:.1f}°."
            
            grouped_results.append(MovementAnomaliesDB(
                athlete_id=athlete_id,
                session_id=session_id,
                video_id=video_id,
                anomaly_type=anomaly_type,
                frame_number=peak["frame"],
                severity=severity,
                affected_joint=joint_name,
                observed_value=peak["val"],
                expected_value=threshold,
                description=desc
            ))

        return grouped_results
