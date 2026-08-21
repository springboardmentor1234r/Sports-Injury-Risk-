"""
ML-based movement anomaly detection.

Uses Isolation Forest to identify unusual movement-angle patterns.

Important:
- This is a project-level research indicator.
- It is NOT a medical diagnostic system.
- The model learns the normal/abnormal pattern from the supplied
  movement-angle data.
"""

from statistics import mean, stdev
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_CONTAMINATION = 0.10
MODEL_RANDOM_STATE = 42
MIN_SAMPLES_FOR_ML = 5


# ============================================================
# SAFE DATA UTILITIES
# ============================================================

def _safe_float(value: Any) -> Optional[float]:
    """
    Safely convert a value to float.
    """

    try:
        if value is None:
            return None

        number = float(value)

        if not np.isfinite(number):
            return None

        return number

    except (TypeError, ValueError):
        return None


def _clean_values(
    values: Optional[List[Any]],
) -> List[float]:
    """
    Clean a list of numeric values.
    """

    if not values:
        return []

    cleaned = []

    for value in values:
        number = _safe_float(value)

        if number is not None:
            cleaned.append(number)

    return cleaned


def _safe_stdev(
    values: List[float],
) -> float:
    """
    Safely calculate standard deviation.
    """

    if len(values) < 2:
        return 0.0

    return round(
        stdev(values),
        2,
    )


def _clamp_score(
    value: float,
) -> float:
    """
    Keep anomaly score between 0 and 100.
    """

    return round(
        max(
            0.0,
            min(
                100.0,
                float(value),
            ),
        ),
        2,
    )


def _risk_severity(
    score: float,
) -> str:
    """
    Convert anomaly score into project-level severity.
    """

    score = _clamp_score(score)

    if score >= 70:
        return "High"

    if score >= 40:
        return "Moderate"

    if score >= 20:
        return "Low"

    return "Minimal"


# ============================================================
# ML MODEL
# ============================================================

def _detect_ml_anomalies(
    values: List[float],
) -> Dict[str, Any]:
    """
    Detect anomalous movement values using Isolation Forest.

    Isolation Forest is an unsupervised ML algorithm.

    It does not require manually labelled injury data.

    Returns:
        anomaly_count
        anomaly_ratio
        ml_score
        anomaly_indices
    """

    if len(values) < MIN_SAMPLES_FOR_ML:

        return {
            "ml_available": False,
            "anomaly_count": 0,
            "anomaly_ratio": 0.0,
            "ml_score": 0.0,
            "anomaly_indices": [],
        }

    X = np.asarray(
        values,
        dtype=np.float64,
    ).reshape(-1, 1)

    # Standardize the angle values.
    scaler = StandardScaler()

    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        contamination=MODEL_CONTAMINATION,
        random_state=MODEL_RANDOM_STATE,
        n_estimators=100,
    )

    predictions = model.fit_predict(
        X_scaled
    )

    # Isolation Forest:
    #  1  = normal
    # -1  = anomaly

    anomaly_indices = [
        index
        for index, prediction
        in enumerate(predictions)
        if prediction == -1
    ]

    anomaly_count = len(
        anomaly_indices
    )

    anomaly_ratio = (
        anomaly_count / len(values)
    )

    # decision_function:
    # higher = more normal
    # lower  = more anomalous
    decision_scores = model.decision_function(
        X_scaled
    )

    minimum = float(
        np.min(decision_scores)
    )

    maximum = float(
        np.max(decision_scores)
    )

    if maximum - minimum == 0:

        normalized = np.zeros_like(
            decision_scores
        )

    else:

        normalized = (
            maximum - decision_scores
        ) / (
            maximum - minimum
        )

    ml_score = float(
        np.mean(normalized) * 100.0
    )

    return {
        "ml_available": True,
        "anomaly_count": anomaly_count,
        "anomaly_ratio": round(
            anomaly_ratio,
            4,
        ),
        "ml_score": _clamp_score(
            ml_score
        ),
        "anomaly_indices": anomaly_indices,
    }


# ============================================================
# JOINT ANALYSIS
# ============================================================

def _analyze_joint(
    values: List[float],
    joint_name: str,
) -> Dict[str, Any]:
    """
    Analyze movement of a single joint.

    Combines:
    - statistical variation
    - range analysis
    - Isolation Forest anomaly detection
    """

    if not values:

        return {
            "joint": joint_name,
            "data_available": False,
            "ml_available": False,
            "anomaly": False,
            "anomaly_score": None,
            "ml_anomaly_score": None,
            "mean_angle": None,
            "minimum_angle": None,
            "maximum_angle": None,
            "variation": None,
            "anomaly_count": 0,
            "anomaly_ratio": 0.0,
            "samples": 0,
            "anomaly_indices": [],
            "remarks": [
                f"No {joint_name} angle data available."
            ],
        }

    average = mean(values)

    minimum = min(values)

    maximum = max(values)

    variation = _safe_stdev(
        values
    )

    ml_result = _detect_ml_anomalies(
        values
    )

    ml_score = ml_result[
        "ml_score"
    ]

    # --------------------------------------------------------
    # Statistical movement score
    # --------------------------------------------------------

    statistical_score = 0.0

    remarks = []

    # Large variation indicates unstable movement.
    if variation >= 30:

        statistical_score += 40

        remarks.append(
            f"{joint_name.title()} movement showed high variation."
        )

    elif variation >= 20:

        statistical_score += 25

        remarks.append(
            f"{joint_name.title()} movement showed moderate variation."
        )

    # Extremely small or large angles are treated as
    # project-level movement deviations.
    if minimum < 30:

        statistical_score += 30

        remarks.append(
            f"{joint_name.title()} reached a very low angle."
        )

    elif minimum < 45:

        statistical_score += 15

        remarks.append(
            f"{joint_name.title()} reached a low angle."
        )

    if maximum > 190:

        statistical_score += 20

        remarks.append(
            f"{joint_name.title()} reached an unusually high angle."
        )

    # --------------------------------------------------------
    # Combine ML + statistical evidence
    # --------------------------------------------------------

    if ml_result["ml_available"]:

        anomaly_score = (
            ml_score * 0.70
            + statistical_score * 0.30
        )

    else:

        anomaly_score = statistical_score

    anomaly_score = _clamp_score(
        anomaly_score
    )

    # ML is the primary anomaly signal.
    anomaly_detected = (
        ml_result["anomaly_count"] > 0
        or statistical_score > 0
    )

    if ml_result["anomaly_count"] > 0:

        remarks.append(
            f"ML model detected unusual {joint_name} movement patterns."
        )

    # Remove duplicates while preserving order.
    remarks = list(
        dict.fromkeys(
            remarks
        )
    )

    return {
        "joint": joint_name,
        "data_available": True,

        "ml_available": (
            ml_result["ml_available"]
        ),

        "anomaly": anomaly_detected,

        "anomaly_score": anomaly_score,

        "ml_anomaly_score": (
            ml_result["ml_score"]
        ),

        "mean_angle": round(
            average,
            2,
        ),

        "minimum_angle": round(
            minimum,
            2,
        ),

        "maximum_angle": round(
            maximum,
            2,
        ),

        "variation": variation,

        "anomaly_count": (
            ml_result["anomaly_count"]
        ),

        "anomaly_ratio": (
            ml_result["anomaly_ratio"]
        ),

        "anomaly_indices": (
            ml_result["anomaly_indices"]
        ),

        "samples": len(values),

        "remarks": remarks,
    }


# ============================================================
# LEFT-RIGHT ASYMMETRY
# ============================================================

def calculate_asymmetry(
    left_values: Optional[List[Any]],
    right_values: Optional[List[Any]],
    joint_name: str,
) -> Dict[str, Any]:
    """
    Calculate left-right movement asymmetry.

    This remains a biomechanical/statistical indicator,
    while the individual movement anomaly detection is ML based.
    """

    left_values = _clean_values(
        left_values
    )

    right_values = _clean_values(
        right_values
    )

    if not left_values or not right_values:

        return {
            "joint": joint_name,
            "data_available": False,
            "difference": None,
            "asymmetry_score": None,
            "anomaly": False,
            "left_average": None,
            "right_average": None,
            "samples_left": len(
                left_values
            ),
            "samples_right": len(
                right_values
            ),
            "remarks": [
                f"Insufficient left-right {joint_name} data."
            ],
        }

    left_average = mean(
        left_values
    )

    right_average = mean(
        right_values
    )

    difference = abs(
        left_average
        - right_average
    )

    # Convert difference to a 0-100 asymmetry score.
    #
    # 0 degrees difference -> 0 risk
    # 30+ degrees difference -> 100
    asymmetry_score = _clamp_score(
        (difference / 30.0)
        * 100.0
    )

    anomaly = (
        difference >= 10.0
    )

    remarks = []

    if difference >= 30:

        remarks.append(
            f"Severe {joint_name} left-right asymmetry detected."
        )

    elif difference >= 20:

        remarks.append(
            f"High {joint_name} left-right asymmetry detected."
        )

    elif difference >= 10:

        remarks.append(
            f"Moderate {joint_name} left-right asymmetry detected."
        )

    return {
        "joint": joint_name,
        "data_available": True,

        "difference": round(
            difference,
            2,
        ),

        "asymmetry_score": round(
            asymmetry_score,
            2,
        ),

        "anomaly": anomaly,

        "left_average": round(
            left_average,
            2,
        ),

        "right_average": round(
            right_average,
            2,
        ),

        "samples_left": len(
            left_values
        ),

        "samples_right": len(
            right_values
        ),

        "remarks": remarks,
    }


# ============================================================
# MAIN ANOMALY DETECTION FUNCTION
# ============================================================

def detect_movement_anomalies(
    left_knee_angles=None,
    right_knee_angles=None,
    left_hip_angles=None,
    right_hip_angles=None,
    left_elbow_angles=None,
    right_elbow_angles=None,
) -> Dict[str, Any]:
    """
    Main ML-based movement anomaly detection pipeline.

    Input:
        Joint-angle sequences obtained from pose estimation /
        biomechanical analysis.

    Output:
        Structured anomaly-analysis result consumed by:

        - injury_prediction.py
        - risk_engine.py
        - API endpoints
        - frontend dashboard
    """

    # --------------------------------------------------------
    # CLEAN INPUT
    # --------------------------------------------------------

    left_knee_angles = _clean_values(
        left_knee_angles
    )

    right_knee_angles = _clean_values(
        right_knee_angles
    )

    left_hip_angles = _clean_values(
        left_hip_angles
    )

    right_hip_angles = _clean_values(
        right_hip_angles
    )

    left_elbow_angles = _clean_values(
        left_elbow_angles
    )

    right_elbow_angles = _clean_values(
        right_elbow_angles
    )

    # --------------------------------------------------------
    # TOTAL DATA
    # --------------------------------------------------------

    total_samples = (
        len(left_knee_angles)
        + len(right_knee_angles)
        + len(left_hip_angles)
        + len(right_hip_angles)
        + len(left_elbow_angles)
        + len(right_elbow_angles)
    )

    if total_samples == 0:

        return {
            "data_available": False,

            "ml_available": False,

            "overall_anomaly_score": None,

            "severity": "Unknown",

            "anomaly_detected": False,

            "anomaly_count": 0,

            "asymmetry_count": 0,

            "joint_analysis": {},

            "asymmetry_analysis": {},

            "samples_analyzed": {},

            "remarks": [
                "No movement angle data was available for anomaly analysis."
            ],
        }

    # --------------------------------------------------------
    # JOINT ML ANALYSIS
    # --------------------------------------------------------

    joint_results = {

        "left_knee": _analyze_joint(
            left_knee_angles,
            "knee",
        ),

        "right_knee": _analyze_joint(
            right_knee_angles,
            "knee",
        ),

        "left_hip": _analyze_joint(
            left_hip_angles,
            "hip",
        ),

        "right_hip": _analyze_joint(
            right_hip_angles,
            "hip",
        ),

        "left_elbow": _analyze_joint(
            left_elbow_angles,
            "elbow",
        ),

        "right_elbow": _analyze_joint(
            right_elbow_angles,
            "elbow",
        ),
    }

    # --------------------------------------------------------
    # ASYMMETRY
    # --------------------------------------------------------

    asymmetry = {

        "knee": calculate_asymmetry(
            left_knee_angles,
            right_knee_angles,
            "knee",
        ),

        "hip": calculate_asymmetry(
            left_hip_angles,
            right_hip_angles,
            "hip",
        ),

        "elbow": calculate_asymmetry(
            left_elbow_angles,
            right_elbow_angles,
            "elbow",
        ),
    }

    # --------------------------------------------------------
    # VALID RESULTS
    # --------------------------------------------------------

    valid_joint_results = [
        result
        for result in joint_results.values()
        if result["data_available"]
    ]

    valid_asymmetry_results = [
        result
        for result in asymmetry.values()
        if result["data_available"]
    ]

    # --------------------------------------------------------
    # COUNTS
    # --------------------------------------------------------

    anomaly_count = sum(
        1
        for result in valid_joint_results
        if result["anomaly"]
    )

    asymmetry_count = sum(
        1
        for result in valid_asymmetry_results
        if result["anomaly"]
    )

    # --------------------------------------------------------
    # JOINT SCORES
    # --------------------------------------------------------

    joint_scores = [
        result["anomaly_score"]
        for result in valid_joint_results
        if result["anomaly_score"] is not None
    ]

    asymmetry_scores = [
        result["asymmetry_score"]
        for result in valid_asymmetry_results
        if result["asymmetry_score"] is not None
    ]

    average_anomaly_score = (
        sum(joint_scores)
        / len(joint_scores)
        if joint_scores
        else 0.0
    )

    average_asymmetry_score = (
        sum(asymmetry_scores)
        / len(asymmetry_scores)
        if asymmetry_scores
        else 0.0
    )

    # --------------------------------------------------------
    # OVERALL ML ANOMALY SCORE
    # --------------------------------------------------------

    overall_score = (
        average_anomaly_score * 0.70
        + average_asymmetry_score * 0.30
    )

    overall_score = _clamp_score(
        overall_score
    )

    # --------------------------------------------------------
    # ML AVAILABILITY
    # --------------------------------------------------------

    ml_available = any(
        result.get(
            "ml_available",
            False,
        )
        for result in valid_joint_results
    )

    # --------------------------------------------------------
    # REMARKS
    # --------------------------------------------------------

    remarks = []

    for result in valid_joint_results:

        remarks.extend(
            result["remarks"]
        )

    for result in valid_asymmetry_results:

        remarks.extend(
            result["remarks"]
        )

    remarks = list(
        dict.fromkeys(
            remarks
        )
    )

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {
        "data_available": True,

        "ml_available": ml_available,

        "model": "IsolationForest",

        "overall_anomaly_score": overall_score,

        "severity": _risk_severity(
            overall_score
        ),

        "anomaly_detected": (
            anomaly_count > 0
            or asymmetry_count > 0
        ),

        "anomaly_count": anomaly_count,

        "asymmetry_count": asymmetry_count,

        "joint_analysis": joint_results,

        "asymmetry_analysis": asymmetry,

        "samples_analyzed": {

            "left_knee": len(
                left_knee_angles
            ),

            "right_knee": len(
                right_knee_angles
            ),

            "left_hip": len(
                left_hip_angles
            ),

            "right_hip": len(
                right_hip_angles
            ),

            "left_elbow": len(
                left_elbow_angles
            ),

            "right_elbow": len(
                right_elbow_angles
            ),
        },

        "remarks": remarks,
    }