def _safe_float(value, default=None):
    """
    Safely convert a value to float.

    Returns None when the value is unavailable instead of
    creating a fake/default performance score.
    """

    if value is None:
        return default

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _add_recommendation(
    recommendations,
    category,
    priority,
    recommendation,
    reason=None
):
    """
    Add a recommendation to the recommendation list.
    """

    item = {
        "category": category,
        "priority": priority,
        "recommendation": recommendation
    }

    if reason:
        item["reason"] = reason

    recommendations.append(item)


def _get_symmetry_score(biomechanics):
    """
    Extract symmetry score from biomechanical analysis.
    """

    symmetry_data = biomechanics.get(
        "movement_symmetry"
    )

    if not isinstance(symmetry_data, dict):
        return None

    return _safe_float(
        symmetry_data.get("symmetry_score")
    )


def _get_alignment(biomechanics):
    """
    Extract joint alignment result from biomechanical analysis.
    """

    alignment = biomechanics.get(
        "joint_alignment"
    )

    if alignment is None:
        return None

    return str(alignment)


def _get_injury_risks(injury_prediction):
    """
    Extract injury prediction results safely.
    """

    injury_risks = injury_prediction.get(
        "injury_risks",
        []
    )

    if not isinstance(injury_risks, list):
        return []

    return injury_risks


def _priority_from_score(score):
    """
    Convert numerical risk score into recommendation priority.
    """

    if score >= 75:
        return "Critical"

    if score >= 50:
        return "High"

    if score >= 25:
        return "Moderate"

    return "Low"


def _remove_duplicates(recommendations):
    """
    Remove duplicate recommendations while preserving
    the highest-priority ordering later.
    """

    unique = []
    seen = set()

    for item in recommendations:

        key = (
            item.get("category"),
            item.get("recommendation")
        )

        if key in seen:
            continue

        seen.add(key)
        unique.append(item)

    return unique


def _sort_recommendations(recommendations):
    """
    Sort recommendations from most important to least important.
    """

    priority_order = {
        "Critical": 0,
        "High": 1,
        "Moderate": 2,
        "Low": 3
    }

    recommendations.sort(
        key=lambda item: priority_order.get(
            item.get("priority"),
            4
        )
    )

    return recommendations


def generate_recommendations(
    risk_data=None,
    anomaly_data=None,
    injury_prediction=None,
    biomechanics=None
):
    """
    Generate recommendations using actual analysis results.

    Data flow:

        Video
          ↓
        Pose Estimation
          ↓
        Biomechanical Analysis
          ↓
        Anomaly Detection
          ↓
        Injury Prediction
          ↓
        Risk Engine
          ↓
        Recommendation Engine

    No unavailable analysis value is treated as a perfect score.
    """

    risk_data = (
        risk_data
        if isinstance(risk_data, dict)
        else {}
    )

    anomaly_data = (
        anomaly_data
        if isinstance(anomaly_data, dict)
        else {}
    )

    injury_prediction = (
        injury_prediction
        if isinstance(injury_prediction, dict)
        else {}
    )

    biomechanics = (
        biomechanics
        if isinstance(biomechanics, dict)
        else {}
    )

    recommendations = []

    risk_score = _safe_float(
        risk_data.get("risk_score")
    )

    risk_level = risk_data.get(
        "risk_level"
    )

    anomaly_score = _safe_float(
        anomaly_data.get(
            "overall_anomaly_score"
        )
    )

    movement_quality = _safe_float(
        biomechanics.get(
            "movement_quality"
        )
    )

    balance_score = _safe_float(
        biomechanics.get(
            "balance_score"
        )
    )

    symmetry_score = _get_symmetry_score(
        biomechanics
    )

    alignment = _get_alignment(
        biomechanics
    )

    injury_risks = _get_injury_risks(
        injury_prediction
    )

    if risk_score is not None:

        priority = _priority_from_score(
            risk_score
        )

        if risk_score >= 75:

            _add_recommendation(
                recommendations,
                "Risk Management",
                "Critical",
                "Avoid high-intensity training until the abnormal movement pattern is assessed.",
                f"Overall injury risk score is {risk_score:.2f}."
            )

        elif risk_score >= 50:

            _add_recommendation(
                recommendations,
                "Risk Management",
                "High",
                "Reduce high-intensity activity and perform an additional movement assessment.",
                f"Overall injury risk score is {risk_score:.2f}."
            )

        elif risk_score >= 25:

            _add_recommendation(
                recommendations,
                "Risk Management",
                "Moderate",
                "Monitor movement quality and adjust training intensity when necessary.",
                f"Overall injury risk score is {risk_score:.2f}."
            )

        else:

            _add_recommendation(
                recommendations,
                "Risk Management",
                "Low",
                "Continue training while regularly monitoring movement quality and injury-risk indicators.",
                f"Overall injury risk score is {risk_score:.2f}."
            )

    if movement_quality is not None:

        if movement_quality < 50:

            _add_recommendation(
                recommendations,
                "Movement Quality",
                "High",
                "Perform technique-correction exercises and reassess movement quality.",
                f"Movement quality score is {movement_quality:.2f}."
            )

        elif movement_quality < 70:

            _add_recommendation(
                recommendations,
                "Movement Quality",
                "Moderate",
                "Include controlled movement and technique drills during training.",
                f"Movement quality score is {movement_quality:.2f}."
            )

    if symmetry_score is not None:

        if symmetry_score < 60:

            _add_recommendation(
                recommendations,
                "Mobility",
                "High",
                "Perform unilateral mobility and corrective exercises to improve left-right movement symmetry.",
                f"Movement symmetry score is {symmetry_score:.2f}."
            )

        elif symmetry_score < 80:

            _add_recommendation(
                recommendations,
                "Mobility",
                "Moderate",
                "Include mobility exercises targeting the weaker or less-controlled side.",
                f"Movement symmetry score is {symmetry_score:.2f}."
            )

    if balance_score is not None:

        if balance_score < 60:

            _add_recommendation(
                recommendations,
                "Balance",
                "High",
                "Add single-leg balance, stability, and controlled landing exercises.",
                f"Balance score is {balance_score:.2f}."
            )

        elif balance_score < 80:

            _add_recommendation(
                recommendations,
                "Balance",
                "Moderate",
                "Include balance and lower-limb stability exercises.",
                f"Balance score is {balance_score:.2f}."
            )

    if alignment is not None:

        alignment_lower = alignment.lower()

        if (
            "poor" in alignment_lower
            or "abnormal" in alignment_lower
        ):

            _add_recommendation(
                recommendations,
                "Alignment",
                "High",
                "Perform movement technique correction with emphasis on joint alignment.",
                f"Joint alignment analysis: {alignment}."
            )

        elif (
            "slight" in alignment_lower
            or "deviation" in alignment_lower
        ):

            _add_recommendation(
                recommendations,
                "Alignment",
                "Moderate",
                "Monitor joint alignment during movement and technique drills.",
                f"Joint alignment analysis: {alignment}."
            )

    if anomaly_score is not None:

        if anomaly_score >= 70:

            _add_recommendation(
                recommendations,
                "Movement Anomaly",
                "High",
                "Repeat the movement assessment and review the abnormal movement patterns detected in the video.",
                f"Overall anomaly score is {anomaly_score:.2f}."
            )

        elif anomaly_score >= 40:

            _add_recommendation(
                recommendations,
                "Movement Anomaly",
                "Moderate",
                "Monitor repeated movement deviations during training and reassessment.",
                f"Overall anomaly score is {anomaly_score:.2f}."
            )

    for injury in injury_risks:

        if not isinstance(injury, dict):
            continue

        injury_name = str(
            injury.get(
                "injury",
                ""
            )
        )

        injury_score = _safe_float(
            injury.get(
                "risk_score"
            )
        )

        if injury_score is None:
            continue

        if injury_score < 40:
            continue

        priority = (
            "Critical"
            if injury_score >= 75
            else "High"
            if injury_score >= 50
            else "Moderate"
        )

        risk_factors = injury.get(
            "risk_factors",
            []
        )

        reason = None

        if isinstance(
            risk_factors,
            list
        ) and risk_factors:

            reason = "; ".join(
                str(factor)
                for factor in risk_factors
            )

        if "ACL" in injury_name:

            _add_recommendation(
                recommendations,
                "ACL Prevention",
                priority,
                "Include knee stability, landing mechanics, and lower-limb alignment exercises.",
                reason
            )

        elif "Hamstring" in injury_name:

            _add_recommendation(
                recommendations,
                "Hamstring Prevention",
                priority,
                "Include hamstring strengthening, controlled flexibility, and progressive loading exercises.",
                reason
            )

        elif "Ankle" in injury_name:

            _add_recommendation(
                recommendations,
                "Ankle Prevention",
                priority,
                "Include ankle stability, proprioception, balance, and controlled landing exercises.",
                reason
            )

        elif "Shoulder" in injury_name:

            _add_recommendation(
                recommendations,
                "Shoulder Prevention",
                priority,
                "Include shoulder mobility, rotator-cuff strengthening, and controlled upper-limb exercises.",
                reason
            )

        elif "Lower Back" in injury_name:

            _add_recommendation(
                recommendations,
                "Lower Back Prevention",
                priority,
                "Include core stability, hip mobility, and controlled trunk movement exercises.",
                reason
            )

        elif "Overuse" in injury_name:

            _add_recommendation(
                recommendations,
                "Recovery",
                priority,
                "Increase recovery time and avoid sudden increases in training intensity or training volume.",
                reason
            )

    if risk_level is not None:

        risk_level_normalized = str(
            risk_level
        ).strip().lower()

        if risk_level_normalized in {
            "critical",
            "high"
        }:

            _add_recommendation(
                recommendations,
                "Recovery",
                "High",
                "Prioritize recovery and reassess movement before returning to high-intensity activity.",
                f"Risk level from analysis: {risk_level}."
            )

        elif risk_level_normalized == "moderate":

            _add_recommendation(
                recommendations,
                "Recovery",
                "Moderate",
                "Maintain adequate recovery between training sessions.",
                f"Risk level from analysis: {risk_level}."
            )

    if not recommendations:

        if (
            risk_score is None
            and anomaly_score is None
            and movement_quality is None
            and balance_score is None
            and symmetry_score is None
            and alignment is None
            and not injury_risks
        ):

            return {
                "total_recommendations": 0,
                "recommendations": [],
                "analysis_status": "Insufficient analysis data."
            }

        _add_recommendation(
            recommendations,
            "Monitoring",
            "Low",
            "Continue monitoring movement quality, biomechanics, and injury-risk indicators.",
            "No recommendation-triggering abnormality was identified in the available analysis."
        )

    recommendations = _remove_duplicates(
        recommendations
    )

    recommendations = _sort_recommendations(
        recommendations
    )

    return {
        "total_recommendations": len(
            recommendations
        ),
        "recommendations": recommendations,
        "analysis_status": "Analysis-based"
    }