"""
Unified project-level risk analysis engine.

The authoritative overall injury-risk score comes from:

    injury_prediction["overall_risk_score"]

This module combines:
    - movement anomaly information
    - movement asymmetry
    - biomechanical quality
    - ML injury prediction

This is NOT a medical diagnostic system.
"""

from typing import Any, Dict, List, Optional


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:

    try:

        if value is None:
            return default

        return float(value)

    except (
        TypeError,
        ValueError,
    ):

        return default


def _clamp_score(
    value: Any,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> Optional[float]:

    if value is None:
        return None

    try:

        number = float(value)

    except (
        TypeError,
        ValueError,
    ):

        return None

    return round(
        max(
            minimum,
            min(
                maximum,
                number,
            ),
        ),
        2,
    )


def _risk_level(
    score: Optional[float],
) -> str:

    if score is None:
        return "Unknown"

    score = _safe_float(
        score
    )

    if score >= 70:
        return "High"

    if score >= 40:
        return "Moderate"

    if score >= 20:
        return "Low"

    return "Minimal"


def _get_joint_anomaly(
    anomaly_data: Dict[str, Any],
    joint: str,
) -> Optional[float]:

    joint_analysis = (
        anomaly_data.get(
            "joint_analysis",
            {},
        )
    )

    if not isinstance(
        joint_analysis,
        dict,
    ):
        return None

    result = joint_analysis.get(
        joint,
        {},
    )

    if not isinstance(
        result,
        dict,
    ):
        return None

    return _clamp_score(
        result.get(
            "anomaly_score"
        )
    )


def _get_asymmetry(
    anomaly_data: Dict[str, Any],
    joint: str,
) -> Optional[float]:

    asymmetry_analysis = (
        anomaly_data.get(
            "asymmetry_analysis",
            {},
        )
    )

    if not isinstance(
        asymmetry_analysis,
        dict,
    ):
        return None

    result = asymmetry_analysis.get(
        joint,
        {},
    )

    if not isinstance(
        result,
        dict,
    ):
        return None

    return _clamp_score(
        result.get(
            "asymmetry_score"
        )
    )


def _get_biomechanical_score(
    biomechanics: Dict[str, Any],
    key: str,
    nested_key: Optional[str] = None,
) -> Optional[float]:

    value = biomechanics.get(
        key
    )

    if nested_key is not None:

        if not isinstance(
            value,
            dict,
        ):
            return None

        value = value.get(
            nested_key
        )

    return _clamp_score(
        value
    )


def _get_injury_prediction_score(
    injury_prediction: Dict[str, Any],
) -> Optional[float]:

    return _clamp_score(
        injury_prediction.get(
            "overall_risk_score"
        )
    )


def _get_highest_injury_prediction(
    injury_prediction: Dict[str, Any],
) -> Dict[str, Any]:

    highest = injury_prediction.get(
        "highest_risk"
    )

    if isinstance(
        highest,
        dict,
    ):

        return highest

    injury_risks = (
        injury_prediction.get(
            "injury_risks",
            [],
        )
    )

    if not isinstance(
        injury_risks,
        list,
    ):

        return {
            "injury": "Unknown",
            "risk_score": None,
            "risk_level": "Unknown",
            "risk_factors": [],
        }

    available = [
        item
        for item in injury_risks
        if (
            isinstance(
                item,
                dict,
            )
            and item.get(
                "risk_score"
            ) is not None
        )
    ]

    if not available:

        return {
            "injury": "Insufficient Data",
            "risk_score": None,
            "risk_level": "Unknown",
            "risk_factors": [],
        }

    return max(
        available,
        key=lambda item:
        _safe_float(
            item.get(
                "risk_score"
            )
        ),
    )


def _add_unique(
    values: List[str],
    condition: bool,
    message: str,
) -> None:

    if (
        condition
        and message not in values
    ):

        values.append(
            message
        )


def calculate_risk(
    anomaly_data: Optional[
        Dict[str, Any]
    ] = None,
    injury_prediction: Optional[
        Dict[str, Any]
    ] = None,
    biomechanics: Optional[
        Dict[str, Any]
    ] = None,
) -> Dict[str, Any]:

    anomaly_data = (
        anomaly_data
        if isinstance(
            anomaly_data,
            dict,
        )
        else {}
    )

    injury_prediction = (
        injury_prediction
        if isinstance(
            injury_prediction,
            dict,
        )
        else {}
    )

    biomechanics = (
        biomechanics
        if isinstance(
            biomechanics,
            dict,
        )
        else {}
    )

    # ========================================================
    # DATA EXTRACTION
    # ========================================================

    knee_anomaly_values = [
        _get_joint_anomaly(
            anomaly_data,
            "left_knee",
        ),
        _get_joint_anomaly(
            anomaly_data,
            "right_knee",
        ),
    ]

    knee_anomaly_values = [
        value
        for value in knee_anomaly_values
        if value is not None
    ]

    hip_anomaly_values = [
        _get_joint_anomaly(
            anomaly_data,
            "left_hip",
        ),
        _get_joint_anomaly(
            anomaly_data,
            "right_hip",
        ),
    ]

    hip_anomaly_values = [
        value
        for value in hip_anomaly_values
        if value is not None
    ]

    elbow_anomaly_values = [
        _get_joint_anomaly(
            anomaly_data,
            "left_elbow",
        ),
        _get_joint_anomaly(
            anomaly_data,
            "right_elbow",
        ),
    ]

    elbow_anomaly_values = [
        value
        for value in elbow_anomaly_values
        if value is not None
    ]

    knee_anomaly = (
        max(
            knee_anomaly_values
        )
        if knee_anomaly_values
        else None
    )

    hip_anomaly = (
        max(
            hip_anomaly_values
        )
        if hip_anomaly_values
        else None
    )

    elbow_anomaly = (
        max(
            elbow_anomaly_values
        )
        if elbow_anomaly_values
        else None
    )

    knee_asymmetry = _get_asymmetry(
        anomaly_data,
        "knee",
    )

    hip_asymmetry = _get_asymmetry(
        anomaly_data,
        "hip",
    )

    elbow_asymmetry = _get_asymmetry(
        anomaly_data,
        "elbow",
    )

    overall_anomaly = _clamp_score(
        anomaly_data.get(
            "overall_anomaly_score"
        )
    )

    movement_quality = (
        _get_biomechanical_score(
            biomechanics,
            "movement_quality",
        )
    )

    balance = (
        _get_biomechanical_score(
            biomechanics,
            "balance_score",
        )
    )

    symmetry = (
        _get_biomechanical_score(
            biomechanics,
            "movement_symmetry",
            "symmetry_score",
        )
    )

    authoritative_risk = (
        _get_injury_prediction_score(
            injury_prediction
        )
    )

    highest_risk = (
        _get_highest_injury_prediction(
            injury_prediction
        )
    )

    # ========================================================
    # RISK FACTORS
    # ========================================================

    factors: List[str] = []

    _add_unique(
        factors,
        knee_anomaly is not None
        and knee_anomaly >= 40,
        "Abnormal knee movement detected.",
    )

    _add_unique(
        factors,
        hip_anomaly is not None
        and hip_anomaly >= 40,
        "Abnormal hip movement detected.",
    )

    _add_unique(
        factors,
        elbow_anomaly is not None
        and elbow_anomaly >= 40,
        "Abnormal elbow movement detected.",
    )

    _add_unique(
        factors,
        knee_asymmetry is not None
        and knee_asymmetry >= 40,
        "Significant knee movement asymmetry detected.",
    )

    _add_unique(
        factors,
        hip_asymmetry is not None
        and hip_asymmetry >= 40,
        "Significant hip movement asymmetry detected.",
    )

    _add_unique(
        factors,
        elbow_asymmetry is not None
        and elbow_asymmetry >= 40,
        "Significant elbow movement asymmetry detected.",
    )

    _add_unique(
        factors,
        overall_anomaly is not None
        and overall_anomaly >= 50,
        "High movement anomaly detected.",
    )

    highest_score = highest_risk.get(
        "risk_score"
    )

    _add_unique(
        factors,
        highest_score is not None
        and _safe_float(
            highest_score
        ) >= 70,
        "High injury-specific risk detected.",
    )

    _add_unique(
        factors,
        movement_quality is not None
        and movement_quality < 40,
        "Low movement quality detected.",
    )

    _add_unique(
        factors,
        balance is not None
        and balance < 40,
        "Low movement balance detected.",
    )

    _add_unique(
        factors,
        symmetry is not None
        and symmetry < 40,
        "Low movement symmetry detected.",
    )

    prediction_factors = (
        highest_risk.get(
            "risk_factors",
            [],
        )
    )

    if isinstance(
        prediction_factors,
        list,
    ):

        for factor in prediction_factors:

            if (
                isinstance(
                    factor,
                    str,
                )
                and factor not in factors
            ):

                factors.append(
                    factor
                )

    # ========================================================
    # RECOMMENDATIONS
    # ========================================================

    recommendations: List[str] = []

    _add_unique(
        recommendations,
        knee_anomaly is not None
        and knee_anomaly >= 40,
        "Review knee alignment and lower-limb movement technique.",
    )

    _add_unique(
        recommendations,
        hip_anomaly is not None
        and hip_anomaly >= 40,
        "Review hip stability and movement control.",
    )

    _add_unique(
        recommendations,
        elbow_anomaly is not None
        and elbow_anomaly >= 40,
        "Review upper-limb movement mechanics.",
    )

    _add_unique(
        recommendations,
        any(
            value is not None
            and value >= 40
            for value in (
                knee_asymmetry,
                hip_asymmetry,
                elbow_asymmetry,
            )
        ),
        "Perform additional movement symmetry assessment.",
    )

    _add_unique(
        recommendations,
        movement_quality is not None
        and movement_quality < 40,
        "Improve movement quality through corrective technique exercises.",
    )

    _add_unique(
        recommendations,
        balance is not None
        and balance < 40,
        "Include balance and stability exercises.",
    )

    if authoritative_risk is not None:

        if authoritative_risk >= 70:

            recommendations.append(
                "High overall injury-risk indicator requires additional movement assessment."
            )

        elif authoritative_risk >= 40:

            recommendations.append(
                "Monitor movement quality and adjust training intensity when necessary."
            )

        else:

            recommendations.append(
                "Continue monitoring movement quality and reassess periodically."
            )

    else:

        recommendations.append(
            "Insufficient data for overall injury-risk classification."
        )

    recommendations = list(
        dict.fromkeys(
            recommendations
        )
    )

    # ========================================================
    # DATA COMPLETENESS
    # ========================================================

    possible_inputs = [
        overall_anomaly,
        movement_quality,
        balance,
        symmetry,
        authoritative_risk,
        highest_score,
    ]

    available_inputs = sum(
        value is not None
        for value in possible_inputs
    )

    data_completeness = round(
        (
            available_inputs
            / len(
                possible_inputs
            )
        ) * 100,
        2,
    )

    # ========================================================
    # RETURN
    # ========================================================

    return {
        "analysis_available":
            authoritative_risk is not None,

        "prediction_method":
            injury_prediction.get(
                "prediction_method",
                "unknown",
            ),

        "risk_score":
            authoritative_risk,

        "risk_level":
            _risk_level(
                authoritative_risk
            ),

        "risk_factors":
            factors,

        "recommendations":
            recommendations,

        "component_scores": {
            "authoritative_injury_prediction":
                authoritative_risk,

            "highest_injury_prediction":
                _clamp_score(
                    highest_score
                ),

            "movement_asymmetry":
                max(
                    [
                        value
                        for value in (
                            knee_asymmetry,
                            hip_asymmetry,
                            elbow_asymmetry,
                        )
                        if value is not None
                    ],
                    default=None,
                ),

            "movement_anomaly":
                overall_anomaly,

            "movement_quality":
                movement_quality,

            "balance":
                balance,

            "symmetry":
                symmetry,
        },

        "joint_scores": {
            "knee_anomaly":
                knee_anomaly,

            "hip_anomaly":
                hip_anomaly,

            "elbow_anomaly":
                elbow_anomaly,

            "knee_asymmetry":
                knee_asymmetry,

            "hip_asymmetry":
                hip_asymmetry,

            "elbow_asymmetry":
                elbow_asymmetry,
        },

        "highest_risk": {
            "injury":
                highest_risk.get(
                    "injury",
                    "Unknown",
                ),

            "risk_score":
                _clamp_score(
                    highest_score
                ),

            "risk_level":
                highest_risk.get(
                    "risk_level",
                    "Unknown",
                ),

            "risk_factors":
                prediction_factors,
        },

        "data_completeness":
            data_completeness,

        "remarks":
            factors,
    }