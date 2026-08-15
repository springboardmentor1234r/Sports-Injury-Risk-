import pandas as pd
import numpy as np
from scipy.signal import find_peaks

# =========================================================================
# THRESHOLDS -- starting values, based on general sports-science knowledge.
# These are meant to be tuned later; they are NOT hard scientific constants.
# =========================================================================

ROM_MIN_NORMAL = 40      # degrees -- below this = too restricted (deviation)
ROM_MAX_NORMAL = 150     # degrees -- above this = possibly unstable (deviation)
JOINT_ALIGNMENT_THRESHOLD = 0.05   # normalized units
BALANCE_SWAY_THRESHOLD = 0.05      # normalized units
SYMMETRY_THRESHOLD_DEGREES = 15    # degrees -- avg left-right gap considered "asymmetric"
FATIGUE_KNEE_DECLINE_THRESHOLD = 10  # degrees -- knee angle drop from first half to second half

RISK_CATEGORY_BINS = [
    (0, 25, "Low Risk"),
    (25, 50, "Moderate Risk"),
    (50, 75, "High Risk"),
    (75, 100.01, "Critical Risk"),
]


def calculate_biomechanical_deviation_score(summary_row: pd.Series):
    """
    Checks ROM, joint alignment, and balance sway against thresholds.
    Returns (combined_score 0-100, rom_score 0-100, alignment_balance_score 0-100, flagged list).

    ROM and alignment/balance are tracked SEPARATELY (not just combined) so they
    can be reused individually for the Biomechanical Efficiency Score and
    Movement Quality Score later.
    """
    flagged = []

    # ---- ROM checks ----
    rom_flagged_count = 0
    rom_checks_total = 0
    rom_columns = [
        "left_knee_rom", "right_knee_rom",
        "left_hip_rom", "right_hip_rom",
        "left_elbow_rom", "right_elbow_rom",
        "left_ankle_rom", "right_ankle_rom",
    ]
    for col in rom_columns:
        if col not in summary_row:
            continue
        rom_checks_total += 1
        value = summary_row[col]
        if value < ROM_MIN_NORMAL:
            flagged.append({"category": "restricted_rom", "issue": f"{col} too low ({value:.1f} deg) - restricted movement"})
            rom_flagged_count += 1
        elif value > ROM_MAX_NORMAL:
            flagged.append({"category": "unstable_rom", "issue": f"{col} too high ({value:.1f} deg) - possible instability"})
            rom_flagged_count += 1

    rom_checks_total = max(rom_checks_total, 1)
    rom_score = (rom_flagged_count / rom_checks_total) * 100

    # ---- Joint alignment + balance checks ----
    align_flagged_count = 0
    align_checks_total = 0

    alignment_columns = ["left_joint_alignment_avg", "right_joint_alignment_avg"]
    for col in alignment_columns:
        if col not in summary_row:
            continue
        align_checks_total += 1
        value = summary_row[col]
        if value > JOINT_ALIGNMENT_THRESHOLD:
            flagged.append({"category": "poor_alignment", "issue": f"{col} above threshold ({value:.3f}) - poor joint alignment"})
            align_flagged_count += 1

    if "balance_sway" in summary_row:
        align_checks_total += 1
        value = summary_row["balance_sway"]
        if value > BALANCE_SWAY_THRESHOLD:
            flagged.append({"category": "balance_issue", "issue": f"balance_sway above threshold ({value:.3f}) - unstable balance"})
            align_flagged_count += 1

    align_checks_total = max(align_checks_total, 1)
    alignment_balance_score = (align_flagged_count / align_checks_total) * 100

    # ---- Combined score (used for the main Injury Risk Score, as before) ----
    total_flagged = rom_flagged_count + align_flagged_count
    total_checks = rom_checks_total + align_checks_total
    combined_score = (total_flagged / total_checks) * 100

    return combined_score, rom_score, alignment_balance_score, flagged


def calculate_asymmetry_score(summary_row: pd.Series):
    """
    Checks left-right symmetry averages against a threshold.
    Returns (score 0-100, list of flagged issue descriptions).
    """
    flagged = []
    symmetry_columns = ["knee_symmetry_avg", "hip_symmetry_avg", "elbow_symmetry_avg", "ankle_symmetry_avg"]
    checks_total = 0

    for col in symmetry_columns:
        if col not in summary_row:
            continue
        checks_total += 1
        value = summary_row[col]
        if value > SYMMETRY_THRESHOLD_DEGREES:
            flagged.append({"category": "asymmetry", "issue": f"{col} above threshold ({value:.1f} deg) - left/right asymmetry"})

    checks_total = max(checks_total, 1)
    score = (len(flagged) / checks_total) * 100
    return score, flagged


def calculate_fatigue_score(biomechanics_df: pd.DataFrame):
    """
    Detects distinct repetitions using local minima of the knee angle and compares
    the depth of the first half of reps vs the second half of reps.
    A noticeable decline (shallower squats) suggests fatigue (declining movement control).
    Returns (score 0-100, list of flagged issue descriptions).
    """
    flagged = []
    declines = []

    for col in ["left_knee_angle", "right_knee_angle"]:
        if col not in biomechanics_df.columns:
            continue
            
        # 1. Invert the signal so troughs (deep squats) become peaks.
        # A standing knee angle is ~180. A deep squat is ~90.
        # By taking negative angle, -90 is higher than -180.
        signal = -biomechanics_df[col].values
        
        # 2. Find peaks.
        # Distance: assuming ~30fps, a rep takes at least 1.5 seconds = 45 frames.
        # Prominence: the squat must have at least 20 degrees of depth change to be considered a rep.
        peaks, _ = find_peaks(signal, distance=45, prominence=20)
        
        if len(peaks) < 4:
            # Not enough distinct reps detected to reliably measure fatigue across halves.
            continue
            
        # 3. Extract the actual depth (angle) at each rep's lowest point
        rep_depths = biomechanics_df[col].iloc[peaks].values
        
        # 4. Split REPS in half (instead of frames)
        midpoint = len(rep_depths) // 2
        first_half_reps = rep_depths[:midpoint]
        second_half_reps = rep_depths[midpoint:]
        
        # We calculate the average depth of the first half vs second half
        first_depth_avg = first_half_reps.mean()
        second_depth_avg = second_half_reps.mean()
        
        # If second_depth_avg is a larger angle, they didn't squat as deep (fatigue)
        decline = second_depth_avg - first_depth_avg 
        declines.append(decline)
        
        if decline > FATIGUE_KNEE_DECLINE_THRESHOLD:
            flagged.append({
                "category": "fatigue",
                "issue": f"{col} depth dropped by {decline:.1f} deg in later reps - possible fatigue"
            })

    if not declines:
        return 0, flagged

    avg_decline = sum(declines) / len(declines)
    # Scale: a 20-degree average decline maps to a 100 fatigue score (capped at 100, floored at 0)
    score = max(0, min(100, (avg_decline / 20) * 100))
    return score, flagged


def get_key_moment_frames(biomechanics_df: pd.DataFrame, max_frames=4, landmarks_df=None) -> list:
    """
    Analyzes knee angles to find the local minima (deepest squats).
    Returns a list of frame indices for the deepest points of the squats.
    Capped at max_frames to avoid uploading too many images.
    """
    all_peaks = set()
    for col in ["left_knee_angle", "right_knee_angle"]:
        if col not in biomechanics_df.columns:
            continue
            
        signal_series = pd.Series(-biomechanics_df[col].values)
        
        # Filter out low-confidence frames if landmarks_df is provided
        if landmarks_df is not None:
            prefix = col.replace("_knee_angle", "") # "left" or "right"
            hip_vis = f"{prefix}_hip_visibility"
            knee_vis = f"{prefix}_knee_visibility"
            ankle_vis = f"{prefix}_ankle_visibility"
            
            if hip_vis in landmarks_df.columns and knee_vis in landmarks_df.columns and ankle_vis in landmarks_df.columns:
                valid_mask = (landmarks_df[hip_vis] >= 0.5) & (landmarks_df[knee_vis] >= 0.5) & (landmarks_df[ankle_vis] >= 0.5)
                if len(valid_mask) == len(signal_series):
                    signal_series.loc[~valid_mask] = np.nan
        
        # Interpolate over the removed glitchy frames so find_peaks has a smooth signal
        signal = signal_series.interpolate(method='linear').ffill().bfill().values
        
        peaks, _ = find_peaks(signal, distance=45, prominence=20)
        
        # We only need the frame indices, which match the DataFrame index if it's 0-indexed.
        # But to be safe, let's grab the actual frame_number if available.
        if "frame_number" in biomechanics_df.columns:
            frame_indices = biomechanics_df["frame_number"].iloc[peaks].tolist()
        else:
            frame_indices = peaks.tolist()
            
        # If no peaks found (e.g. no deep squat), fallback to the absolute minimum angle in the video
        if len(frame_indices) == 0 and len(signal) > 0:
            min_idx = np.argmax(signal) # Since signal is negated, argmax is the min knee angle
            if "frame_number" in biomechanics_df.columns:
                frame_indices = [biomechanics_df["frame_number"].iloc[min_idx]]
            else:
                frame_indices = [min_idx]

        all_peaks.update(frame_indices)

    # Sort the peaks chronologically
    sorted_peaks = sorted(list(all_peaks))
    
    # If we have more than max_frames, evenly sample them
    if len(sorted_peaks) > max_frames:
        step = len(sorted_peaks) / max_frames
        sampled_peaks = [sorted_peaks[int(i * step)] for i in range(max_frames)]
        return sampled_peaks
        
    return sorted_peaks


def calculate_injury_history_score(profile_row: pd.Series):
    """Converts manually entered injury history into a 0-100 score."""
    if str(profile_row.get("has_previous_injury", "No")).strip().lower() != "yes":
        return 0, []

    recency = str(profile_row.get("injury_recency", "")).strip().lower()
    recency_scores = {
        "recent": 90,
        "within 3 months": 90,
        "within 6 months": 80,
        "moderate": 60,
        "within 1 year": 60,
        "old": 30,
        "over 1 year ago": 30,
        "none": 0
    }
    score = recency_scores.get(recency, 50)  # default 50 if recency is unclear

    injury_type = profile_row.get("previous_injury_type", "unspecified")
    flagged = [{"category": "injury_history", "issue": f"Previous {injury_type} injury ({profile_row.get('injury_recency', 'unknown recency')})"}]
    return score, flagged


def calculate_training_load_score(profile_row: pd.Series):
    """Converts manually entered training load into a 0-100 score."""
    intensity = str(profile_row.get("training_intensity", "Medium")).strip().lower()
    intensity_scores = {"low": 20, "medium": 50, "high": 80}
    score = intensity_scores.get(intensity, 50)

    sessions = profile_row.get("weekly_training_sessions", 3)
    try:
        sessions = float(sessions)
    except (ValueError, TypeError):
        sessions = 3

    if sessions >= 6:
        score += 10
    elif sessions <= 2:
        score -= 10

    score = max(0, min(100, score))

    flagged = []
    if score >= 70:
        flagged.append({"category": "high_training_load", "issue": f"High training load ({sessions:.0f} sessions/week, {intensity} intensity)"})

    return score, flagged


def get_demographics_flags(profile_row: pd.Series):
    """
    Checks Age, Gender, and BMI (Height/Weight) for qualitative risk factors.
    Returns a list of flagged_issues. No numerical multiplier is applied.
    """
    flagged = []
    
    # Age factor
    age = profile_row.get("age", 20)
    try:
        age = int(age)
    except (ValueError, TypeError):
        age = 20
        
    if age > 35:
        flagged.append({"category": "general", "issue": f"Age factor ({age} yrs) increases recovery time and tissue vulnerability"})
        
    # Gender factor
    gender = str(profile_row.get("gender", "Male")).strip().lower()
    if gender == "female":
        flagged.append({"category": "general", "issue": "Statistically higher baseline joint vulnerability (e.g., Q-angle impact on ACL)"})
        
    # BMI factor
    height_cm = profile_row.get("height", 175)
    weight_kg = profile_row.get("weight", 70)
    
    try:
        height_m = float(height_cm) / 100
        weight_kg = float(weight_kg)
        if height_m > 0:
            bmi = weight_kg / (height_m * height_m)
            if bmi > 30:
                flagged.append({"category": "general", "issue": f"High BMI ({bmi:.1f}) significantly increases kinetic joint load"})
            elif bmi > 25:
                flagged.append({"category": "general", "issue": f"Elevated BMI ({bmi:.1f}) increases joint load"})
    except (ValueError, TypeError):
        pass
        
    return flagged

def get_sport_flags(profile_row: pd.Series):
    """
    Checks the primary sport for qualitative risk factors.
    Returns a list of flagged_issues. No numerical multiplier is applied.
    """
    flagged = []
    
    sport = str(profile_row.get("sport", "Other")).strip().lower()
    
    high_impact = ["basketball", "soccer", "football", "gymnastics"]
    
    if sport in high_impact:
        flagged.append({"category": "general", "issue": f"High-impact pivoting sport ({sport.capitalize()}) increases baseline injury risk"})
        
    return flagged


def get_risk_category(final_score: float) -> str:
    for low, high, label in RISK_CATEGORY_BINS:
        if low <= final_score < high:
            return label
    return "Unknown"


def calculate_movement_quality_score(asymmetry_score: float, alignment_balance_score: float) -> float:
    """
    Higher = better movement quality (opposite direction from risk scores).
    Based on symmetry + joint alignment/balance -- NOT injury history or training load,
    since those aren't about the movement itself.
    """
    avg_deviation = (asymmetry_score + alignment_balance_score) / 2
    return round(100 - avg_deviation, 1)


def calculate_biomechanical_efficiency_score(rom_score: float) -> float:
    """
    Higher = more efficient range of motion (opposite direction from the ROM
    deviation score -- not too restricted, not excessive).
    """
    return round(100 - rom_score, 1)


def calculate_overall_health_score(final_risk_score: float) -> float:
    """
    Single at-a-glance dashboard number. Higher = healthier.
    Simply the inverse of the final risk score, so it never contradicts it.
    """
    return round(100 - final_risk_score, 1)

