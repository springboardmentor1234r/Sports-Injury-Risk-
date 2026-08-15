import json
import math
import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app import models, schemas

class BiomechanicalAnalytics:
    @staticmethod
    def calculate_angle(a: List[float], b: List[float], c: List[float]) -> float:
        """
        Calculates the angle (in degrees) at vertex B between vectors BA and BC.
        Coordinates are passed as [x, y, z] or [x, y, z, visibility].
        """
        try:
            # Vector BA
            ba = [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
            # Vector BC
            bc = [c[0] - b[0], c[1] - b[1], c[2] - b[2]]
            
            # Dot product
            dot_product = ba[0]*bc[0] + ba[1]*bc[1] + ba[2]*bc[2]
            
            # Magnitudes
            mag_ba = math.sqrt(ba[0]**2 + ba[1]**2 + ba[2]**2)
            mag_bc = math.sqrt(bc[0]**2 + bc[1]**2 + bc[2]**2)
            
            if mag_ba == 0 or mag_bc == 0:
                return 180.0
                
            cos_theta = dot_product / (mag_ba * mag_bc)
            # Clip cos_theta to prevent floating point domain errors
            cos_theta = max(-1.0, min(1.0, cos_theta))
            
            angle_rad = math.acos(cos_theta)
            return math.degrees(angle_rad)
        except Exception:
            return 180.0

    @staticmethod
    def analyze_skeletal_data(skeletal_json: str) -> Dict[str, Any]:
        """
        Parses coordinates JSON list and calculates extension, flexion speeds, and symmetry.
        Landmark indices map:
          11, 12: left/right shoulders
          23, 24: left/right hips
          25, 26: left/right knees
          27, 28: left/right ankles
        """
        try:
            frames = json.loads(skeletal_json)
        except Exception:
            return {
                "max_extension_angle": 180.0,
                "max_flexion_angle": 180.0,
                "flexion_velocity": 0.0,
                "symmetry_index": 100.0,
                "posture_deviation_score": 0.0
            }
            
        left_knee_angles = []
        right_knee_angles = []
        hip_deviations = []
        
        for frame in frames:
            kp = frame["keypoints"]
            if len(kp) < 33:
                continue
                
            # Left Knee Angle (Hip 23 - Knee 25 - Ankle 27)
            lk_angle = BiomechanicalAnalytics.calculate_angle(kp[23], kp[25], kp[27])
            left_knee_angles.append(lk_angle)
            
            # Right Knee Angle (Hip 24 - Knee 26 - Ankle 28)
            rk_angle = BiomechanicalAnalytics.calculate_angle(kp[24], kp[26], kp[28])
            right_knee_angles.append(rk_angle)
            
            # Posture checks: Hip asymmetry or shift
            hip_dev = abs(kp[23][1] - kp[24][1]) # Y coordinate difference
            hip_deviations.append(hip_dev)

        if not left_knee_angles:
            return {
                "max_extension_angle": 180.0,
                "max_flexion_angle": 180.0,
                "flexion_velocity": 0.0,
                "symmetry_index": 100.0,
                "posture_deviation_score": 0.0
            }

        max_ext = max(left_knee_angles + right_knee_angles)
        max_flex = min(left_knee_angles + right_knee_angles)
        
        # Calculate flexion speed as average frame-to-frame change rate
        changes = [abs(left_knee_angles[i] - left_knee_angles[i-1]) for i in range(1, len(left_knee_angles))]
        flex_vel = sum(changes) / len(changes) if changes else 0.0
        
        # Symmetry Index (0 = perfect symmetry, larger = asymmetrical)
        l_min = min(left_knee_angles)
        r_min = min(right_knee_angles)
        symmetry_diff = abs(l_min - r_min)
        symmetry_index = max(0.0, 100.0 - (symmetry_diff * 4.0)) # Scale to a 0-100 score
        
        # Posture deviation index
        posture_dev = sum(hip_deviations) / len(hip_deviations) * 1000.0 # scale for visibility
        posture_dev_score = min(posture_dev, 100.0)
        
        return {
            "max_extension_angle": round(max_ext, 1),
            "max_flexion_angle": round(max_flex, 1),
            "flexion_velocity": round(flex_vel, 2),
            "symmetry_index": round(symmetry_index, 1),
            "posture_deviation_score": round(posture_dev_score, 1)
        }


class OvertrainingRiskAnalytics:
    @staticmethod
    def calculate_acwr(db: Session, athlete_id: int) -> Dict[str, Any]:
        """
        Calculates the Acute-to-Chronic Workload Ratio (ACWR) for a specific athlete.
        - Acute Workload: sum of calculated training loads from the past 7 days.
        - Chronic Workload: average weekly workload over the last 28 days (4 weeks).
        """
        today = datetime.date.today()
        seven_days_ago = today - datetime.timedelta(days=7)
        twenty_eight_days_ago = today - datetime.timedelta(days=28)
        
        # Fetch training logs
        logs = db.query(models.TrainingLoad)\
                 .filter(
                     models.TrainingLoad.athlete_id == athlete_id,
                     models.TrainingLoad.date >= twenty_eight_days_ago
                 ).all()
                 
        if not logs:
            return {
                "acute_workload": 0.0,
                "chronic_workload": 0.0,
                "acwr": 1.0,
                "status": "optimal",
                "risk_factor": "low"
            }
            
        # Group loads
        acute_sum = 0.0
        chronic_weeks = [0.0, 0.0, 0.0, 0.0] # 4 weeks
        
        for log in logs:
            log_date = log.date
            days_diff = (today - log_date).days
            load_val = float(log.calculated_load)
            
            # Acute workload (past 7 days)
            if days_diff <= 7:
                acute_sum += load_val
                
            # Chronic workload sorting
            if days_diff <= 7:
                chronic_weeks[0] += load_val
            elif days_diff <= 14:
                chronic_weeks[1] += load_val
            elif days_diff <= 21:
                chronic_weeks[2] += load_val
            elif days_diff <= 28:
                chronic_weeks[3] += load_val

        # Calculate average weekly load over the 4 weeks (Chronic)
        # Avoid dividing by 0 if no entries exist in some weeks
        active_weeks = [w for w in chronic_weeks if w > 0]
        chronic_avg = sum(chronic_weeks) / 4.0
        if chronic_avg == 0:
            chronic_avg = max(acute_sum, 100.0) # avoid division error
            
        acwr_score = acute_sum / chronic_avg if chronic_avg > 0 else 1.0
        acwr_score = round(acwr_score, 2)
        
        # Determine status and risk
        # Sweet Spot is between 0.8 and 1.3
        # Danger zone is above 1.5 (overtraining) or below 0.5 (undertrained, high injury risk during spikes)
        if 0.8 <= acwr_score <= 1.3:
            status = "optimal"
            risk = "low"
        elif 1.3 < acwr_score <= 1.5:
            status = "over-reaching"
            risk = "medium"
        elif acwr_score > 1.5:
            status = "over-trained"
            risk = "high"
        else:
            status = "under-trained"
            risk = "medium"
            
        return {
            "acute_workload": acute_sum,
            "chronic_workload": round(chronic_avg, 1),
            "acwr": acwr_score,
            "status": status,
            "risk_factor": risk
        }

    @staticmethod
    def predict_injury_risk(db: Session, athlete_id: int, biomechanics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Uses heuristics and rules to estimate the overall injury risk percentage (0 to 100).
        Fuses:
          1. ACWR (Acute-to-Chronic ratio)
          2. Joint asymmetry / Posture deviation from video analysis
          3. Previous injury history (re-injury hazard score)
        """
        acwr_metrics = OvertrainingRiskAnalytics.calculate_acwr(db, athlete_id)
        
        # Base risk begins at 10% (normal baseline)
        risk_pct = 10.0
        primary_factors = []
        
        # 1. Evaluate ACWR impact
        acwr_val = acwr_metrics["acwr"]
        if acwr_val > 1.5:
            risk_pct += 35.0
            primary_factors.append(f"Overtraining spikes detected: Acute load exceeds chronic load limit (ACWR = {acwr_val}).")
        elif acwr_val < 0.5:
            risk_pct += 15.0
            primary_factors.append(f"Under-conditioning warning: Athlete is vulnerable to workload spikes (ACWR = {acwr_val}).")
            
        # 2. Evaluate joint kinematics asymmetry
        sym = biomechanics.get("symmetry_index", 100.0)
        dev = biomechanics.get("posture_deviation_score", 0.0)
        
        if sym < 85.0:
            risk_pct += 25.0
            primary_factors.append(f"Severe lateral movement asymmetry: Left vs. Right joint loading is unbalanced (Symmetry = {sym}%).")
        elif sym < 92.0:
            risk_pct += 10.0
            primary_factors.append(f"Mild movement asymmetry detected (Symmetry = {sym}%).")
            
        if dev > 15.0:
            risk_pct += 15.0
            primary_factors.append("Posture alignment deviation warning: Excessive hip shifting or lateral spine displacement.")

        # 3. Evaluate historical trauma
        # Fetch active or active-rehab injuries
        recent_injuries = db.query(models.InjuryHistory)\
                            .filter(
                                models.InjuryHistory.athlete_id == athlete_id,
                                models.InjuryHistory.status.in_(["active", "rehab"])
                            ).all()
                            
        if recent_injuries:
            for inj in recent_injuries:
                severity_mult = 20.0 if inj.severity == "High" else 10.0 if inj.severity == "Medium" else 5.0
                risk_pct += severity_mult
                primary_factors.append(f"Unresolved injury in region: {inj.body_part} ({inj.injury_type}, Status: {inj.status}).")

        # Cap risk to 95% maximum
        risk_pct = min(risk_pct, 95.0)
        
        # Determine verbal risk level
        if risk_pct > 60.0:
            risk_level = "High"
            recovery_days = 4
            exercises = [
                "De-load training workload immediately by 40%",
                "Perform unilateral bodyweight stability exercises",
                "Integrate foam rolling and active stretching (15 mins)",
                "Complete physical assessment with head physiotherapist"
            ]
        elif risk_pct > 30.0:
            risk_level = "Medium"
            recovery_days = 2
            exercises = [
                "Moderate workload by 15%",
                "Perform corrective core exercises (Planks, Birddogs)",
                "Focus on joint range-of-motion routines",
                "Cold plunge / contrast baths post-activity"
            ]
        else:
            risk_level = "Low"
            recovery_days = 0
            exercises = [
                "Maintain progressive training loads",
                "Standard dynamic warm-up protocol (10 mins)",
                "Cool down stretches"
            ]
            
        if not primary_factors:
            primary_factors.append("Workloads and skeletal movements are balanced within optimal safety ranges.")
            
        return {
            "injury_risk_pct": round(risk_pct, 1),
            "risk_level": risk_level,
            "primary_factors": primary_factors,
            "acwr_metrics": acwr_metrics,
            "recommended_recovery_days": recovery_days,
            "rehab_exercises": exercises
        }
