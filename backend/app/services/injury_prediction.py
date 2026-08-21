"""
ML-based sports injury risk prediction service.

Primary ML model:
RandomForestClassifier

Input:
Biomechanical and movement-analysis features.

Output:
Injury-risk class probabilities,
predicted injury category,
overall risk score,
risk level,
risk factors,
analysis inputs.

IMPORTANT:
This system is a research/project prototype.
It is NOT a medical diagnostic system.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd


# ============================================================
# MODEL LOCATION
# ============================================================

# backend/app/services/injury_prediction.py
#
# parents[0] -> services
# parents[1] -> app
# parents[2] -> backend

MODEL_DIR = (
    Path(__file__).resolve().parents[2]
    / "models"
)

MODEL_PATH = (
    MODEL_DIR
    / "injury_risk_model.joblib"
)


# ============================================================
# INJURY CLASSES
# ============================================================

INJURY_CLASSES = [
    "ACL Injury Risk",
    "Hamstring Injury Risk",
    "Ankle Sprain Risk",
    "Shoulder Injury Risk",
    "Lower Back Injury Risk",
    "Overuse Injury Risk",
]


# ============================================================
# MODEL FEATURES
# ============================================================

FEATURE_NAMES = [
    "overall_anomaly_score",
    "movement_quality",
    "balance_score",
    "symmetry_score",
    "knee_anomaly_score",
    "hip_anomaly_score",
    "elbow_anomaly_score",
    "knee_asymmetry_score",
    "hip_asymmetry_score",
    "elbow_asymmetry_score",
]


# ============================================================
# SAFE NUMERIC HELPERS
# ============================================================

def _safe_float(
    value: Any,
) -> Optional[float]:

    try:

        if value is None:
            return None

        number = float(value)

        if not np.isfinite(number):
            return None

        return number

    except (
        TypeError,
        ValueError,
    ):

        return None


def _clamp_score(
    value: Any,
) -> Optional[float]:

    number = _safe_float(
        value
    )

    if number is None:
        return None

    return round(
        min(
            max(
                number,
                0.0,
            ),
            100.0,
        ),
        2,
    )


# ============================================================
# RISK LEVEL
# ============================================================

def _risk_level(
    score: float,
) -> str:

    score = min(
        max(
            float(score),
            0.0,
        ),
        100.0,
    )

    if score >= 70:
        return "High"

    if score >= 40:
        return "Moderate"

    if score >= 20:
        return "Low"

    return "Minimal"


# ============================================================
# ANOMALY EXTRACTION
# ============================================================

def _get_joint_score(
    anomaly_data: Dict[str, Any],
    joint: str,
) -> Optional[float]:

    joint_analysis = anomaly_data.get(
        "joint_analysis",
        {},
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


def _get_asymmetry_score(
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


# ============================================================
# BIOMECHANICS EXTRACTION
# ============================================================

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


# ============================================================
# FEATURE EXTRACTION
# ============================================================

def _extract_features(
    anomaly_data: Dict[str, Any],
    biomechanics: Dict[str, Any],
) -> Dict[str, float]:

    overall_anomaly = (
        _clamp_score(
            anomaly_data.get(
                "overall_anomaly_score"
            )
        )
    )

    knee_values = [
        _get_joint_score(
            anomaly_data,
            "left_knee",
        ),
        _get_joint_score(
            anomaly_data,
            "right_knee",
        ),
    ]

    hip_values = [
        _get_joint_score(
            anomaly_data,
            "left_hip",
        ),
        _get_joint_score(
            anomaly_data,
            "right_hip",
        ),
    ]

    elbow_values = [
        _get_joint_score(
            anomaly_data,
            "left_elbow",
        ),
        _get_joint_score(
            anomaly_data,
            "right_elbow",
        ),
    ]

    knee_values = [
        value
        for value in knee_values
        if value is not None
    ]

    hip_values = [
        value
        for value in hip_values
        if value is not None
    ]

    elbow_values = [
        value
        for value in elbow_values
        if value is not None
    ]

    knee_anomaly = (
        max(knee_values)
        if knee_values
        else None
    )

    hip_anomaly = (
        max(hip_values)
        if hip_values
        else None
    )

    elbow_anomaly = (
        max(elbow_values)
        if elbow_values
        else None
    )

    knee_asymmetry = (
        _get_asymmetry_score(
            anomaly_data,
            "knee",
        )
    )

    hip_asymmetry = (
        _get_asymmetry_score(
            anomaly_data,
            "hip",
        )
    )

    elbow_asymmetry = (
        _get_asymmetry_score(
            anomaly_data,
            "elbow",
        )
    )

    movement_quality = (
        _get_biomechanical_score(
            biomechanics,
            "movement_quality",
        )
    )

    balance_score = (
        _get_biomechanical_score(
            biomechanics,
            "balance_score",
        )
    )

    symmetry_score = (
        _get_biomechanical_score(
            biomechanics,
            "movement_symmetry",
            "symmetry_score",
        )
    )

    values = {

        "overall_anomaly_score":
            overall_anomaly,

        "movement_quality":
            movement_quality,

        "balance_score":
            balance_score,

        "symmetry_score":
            symmetry_score,

        "knee_anomaly_score":
            knee_anomaly,

        "hip_anomaly_score":
            hip_anomaly,

        "elbow_anomaly_score":
            elbow_anomaly,

        "knee_asymmetry_score":
            knee_asymmetry,

        "hip_asymmetry_score":
            hip_asymmetry,

        "elbow_asymmetry_score":
            elbow_asymmetry,
    }

    return {
        key: (
            float(value)
            if value is not None
            else 0.0
        )
        for key, value in values.items()
    }


# ============================================================
# RISK FACTOR GENERATION
# ============================================================

def _generate_risk_factors(
    injury: str,
    features: Dict[str, float],
) -> List[str]:

    factors = []

    anomaly = features.get(
        "overall_anomaly_score",
        0.0,
    )

    movement_quality = features.get(
        "movement_quality",
        0.0,
    )

    balance = features.get(
        "balance_score",
        0.0,
    )

    symmetry = features.get(
        "symmetry_score",
        0.0,
    )

    knee = features.get(
        "knee_anomaly_score",
        0.0,
    )

    hip = features.get(
        "hip_anomaly_score",
        0.0,
    )

    elbow = features.get(
        "elbow_anomaly_score",
        0.0,
    )

    knee_asymmetry = features.get(
        "knee_asymmetry_score",
        0.0,
    )

    hip_asymmetry = features.get(
        "hip_asymmetry_score",
        0.0,
    )

    elbow_asymmetry = features.get(
        "elbow_asymmetry_score",
        0.0,
    )

    # --------------------------------------------------------
    # ACL
    # --------------------------------------------------------

    if injury == "ACL Injury Risk":

        if knee >= 40:
            factors.append(
                "Abnormal knee movement detected."
            )

        if knee_asymmetry >= 40:
            factors.append(
                "Significant knee left-right asymmetry detected."
            )

        if balance < 60:
            factors.append(
                "Reduced balance control detected."
            )

        if movement_quality < 60:
            factors.append(
                "Reduced movement quality detected."
            )

    # --------------------------------------------------------
    # HAMSTRING
    # --------------------------------------------------------

    elif injury == "Hamstring Injury Risk":

        if hip >= 40:
            factors.append(
                "Abnormal hip movement detected."
            )

        if knee >= 40:
            factors.append(
                "Abnormal knee movement detected."
            )

        if hip_asymmetry >= 40:
            factors.append(
                "Significant hip left-right asymmetry detected."
            )

        if knee_asymmetry >= 40:
            factors.append(
                "Significant knee left-right asymmetry detected."
            )

        if movement_quality < 60:
            factors.append(
                "Reduced movement quality detected."
            )

    # --------------------------------------------------------
    # ANKLE
    # --------------------------------------------------------

    elif injury == "Ankle Sprain Risk":

        if knee >= 40:
            factors.append(
                "Abnormal lower-limb movement detected."
            )

        if anomaly >= 40:
            factors.append(
                "Elevated movement anomaly detected."
            )

        if balance < 60:
            factors.append(
                "Reduced balance control detected."
            )

        if symmetry < 60:
            factors.append(
                "Reduced movement symmetry detected."
            )

    # --------------------------------------------------------
    # SHOULDER
    # --------------------------------------------------------

    elif injury == "Shoulder Injury Risk":

        if elbow >= 40:
            factors.append(
                "Abnormal elbow movement detected."
            )

        if elbow_asymmetry >= 40:
            factors.append(
                "Significant elbow left-right asymmetry detected."
            )

        if movement_quality < 60:
            factors.append(
                "Reduced movement quality detected."
            )

    # --------------------------------------------------------
    # LOWER BACK
    # --------------------------------------------------------

    elif injury == "Lower Back Injury Risk":

        if hip >= 40:
            factors.append(
                "Abnormal hip movement detected."
            )

        if hip_asymmetry >= 40:
            factors.append(
                "Significant hip left-right asymmetry detected."
            )

        if symmetry < 60:
            factors.append(
                "Reduced movement symmetry detected."
            )

        if movement_quality < 60:
            factors.append(
                "Reduced movement quality detected."
            )

    # --------------------------------------------------------
    # OVERUSE
    # --------------------------------------------------------

    elif injury == "Overuse Injury Risk":

        if anomaly >= 40:
            factors.append(
                "Elevated movement anomaly detected."
            )

        if movement_quality < 60:
            factors.append(
                "Reduced movement quality detected."
            )

        if symmetry < 60:
            factors.append(
                "Reduced movement symmetry detected."
            )

        if balance < 60:
            factors.append(
                "Reduced balance control detected."
            )

    # --------------------------------------------------------
    # Generic fallback
    # --------------------------------------------------------

    if not factors:

        if anomaly >= 60:
            factors.append(
                "High overall movement anomaly detected."
            )

        elif anomaly >= 40:
            factors.append(
                "Elevated overall movement anomaly detected."
            )

        if movement_quality < 40:
            factors.append(
                "Reduced movement quality detected."
            )

        if symmetry < 40:
            factors.append(
                "Reduced movement symmetry detected."
            )

        if balance < 40:
            factors.append(
                "Reduced balance control detected."
            )

    return factors


# ============================================================
# LOAD MODEL
# ============================================================

def _load_model():

    if not MODEL_PATH.exists():
        return None

    try:

        return joblib.load(
            MODEL_PATH
        )

    except Exception:

        return None


# ============================================================
# FEATURE VECTOR
# ============================================================

def _build_feature_vector(
    features: Dict[str, float],
) -> pd.DataFrame:

    return pd.DataFrame(
        [
            {
                name: float(
                    features.get(
                        name,
                        0.0,
                    )
                )
                for name in FEATURE_NAMES
            }
        ],
        columns=FEATURE_NAMES,
    )


# ============================================================
# ML PREDICTION
# ============================================================

def _predict_with_ml(
    features: Dict[str, float],
) -> Optional[Dict[str, Any]]:

    model = _load_model()

    if model is None:
        return None

    try:

        vector = _build_feature_vector(
            features
        )

        predicted_class = (
            model.predict(
                vector
            )[0]
        )

        probabilities = None

        if hasattr(
            model,
            "predict_proba",
        ):

            probabilities = (
                model.predict_proba(
                    vector
                )[0]
            )

        classes = list(
            getattr(
                model,
                "classes_",
                [],
            )
        )

        class_probabilities = {}

        if (
            probabilities is not None
            and len(classes)
            == len(probabilities)
        ):

            for (
                class_name,
                probability,
            ) in zip(
                classes,
                probabilities,
            ):

                class_probabilities[
                    str(class_name)
                ] = round(
                    float(
                        probability
                    ) * 100.0,
                    2,
                )

        if probabilities is not None:

            max_probability = float(
                np.max(
                    probabilities
                )
            )

        else:

            max_probability = 0.0

        risk_score = round(
            max_probability * 100.0,
            2,
        )

        return {

            "model_available":
                True,

            "prediction":
                str(
                    predicted_class
                ),

            "risk_score":
                risk_score,

            "risk_level":
                _risk_level(
                    risk_score
                ),

            "class_probabilities":
                class_probabilities,
        }

    except Exception as exc:

        return {

            "model_available":
                False,

            "error":
                str(exc),
        }


# ============================================================
# HEURISTIC FALLBACK
# ============================================================

def _heuristic_prediction(
    features: Dict[str, float],
) -> Dict[str, Any]:

    knee = features[
        "knee_anomaly_score"
    ]

    hip = features[
        "hip_anomaly_score"
    ]

    elbow = features[
        "elbow_anomaly_score"
    ]

    knee_asymmetry = features[
        "knee_asymmetry_score"
    ]

    hip_asymmetry = features[
        "hip_asymmetry_score"
    ]

    elbow_asymmetry = features[
        "elbow_asymmetry_score"
    ]

    anomaly = features[
        "overall_anomaly_score"
    ]

    movement_quality = features[
        "movement_quality"
    ]

    balance = features[
        "balance_score"
    ]

    symmetry = features[
        "symmetry_score"
    ]

    injury_scores = {

        "ACL Injury Risk":
            (
                knee * 0.50
                + knee_asymmetry * 0.30
                + (100 - movement_quality)
                * 0.20
            ),

        "Hamstring Injury Risk":
            (
                hip * 0.40
                + knee * 0.35
                + (100 - movement_quality)
                * 0.15
                + (100 - symmetry)
                * 0.10
            ),

        "Ankle Sprain Risk":
            (
                knee * 0.50
                + anomaly * 0.25
                + (100 - balance)
                * 0.15
                + (100 - movement_quality)
                * 0.10
            ),

        "Shoulder Injury Risk":
            (
                elbow * 0.50
                + elbow_asymmetry * 0.30
                + (100 - movement_quality)
                * 0.20
            ),

        "Lower Back Injury Risk":
            (
                hip * 0.50
                + hip_asymmetry * 0.30
                + (100 - movement_quality)
                * 0.20
            ),

        "Overuse Injury Risk":
            (
                anomaly * 0.50
                + (100 - movement_quality)
                * 0.25
                + (100 - symmetry)
                * 0.15
                + (100 - balance)
                * 0.10
            ),
    }

    injury_results = []

    for injury, raw_score in (
        injury_scores.items()
    ):

        score = round(
            min(
                max(
                    raw_score,
                    0.0,
                ),
                100.0,
            ),
            2,
        )

        factors = _generate_risk_factors(
            injury,
            features,
        )

        injury_results.append(
            {
                "injury":
                    injury,

                "risk_score":
                    score,

                "risk_level":
                    _risk_level(
                        score
                    ),

                "data_available":
                    True,

                "risk_factors":
                    factors,

                "prediction_method":
                    "heuristic_baseline",
            }
        )

    injury_results.sort(
        key=lambda item:
        item["risk_score"],
        reverse=True,
    )

    highest = (
        injury_results[0]
    )

    overall_score = round(
        (
            anomaly * 0.50
            + (100 - movement_quality)
            * 0.20
            + (100 - symmetry)
            * 0.15
            + (100 - balance)
            * 0.15
        ),
        2,
    )

    return {

        "analysis_available":
            True,

        "prediction_method":
            "heuristic_baseline",

        "model_available":
            False,

        "highest_risk":
            highest,

        "injury_risks":
            injury_results,

        "overall_risk_score":
            overall_score,

        "overall_risk_level":
            _risk_level(
                overall_score
            ),
    }


# ============================================================
# PUBLIC API
# ============================================================

def predict_injury_risks(
    anomaly_data: Optional[
        Dict[str, Any]
    ],
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

    biomechanics = (
        biomechanics
        if isinstance(
            biomechanics,
            dict,
        )
        else {}
    )

    # --------------------------------------------------------
    # Extract ML features
    # --------------------------------------------------------

    features = _extract_features(
        anomaly_data,
        biomechanics,
    )

    # --------------------------------------------------------
    # Run Random Forest
    # --------------------------------------------------------

    ml_result = _predict_with_ml(
        features
    )

    # ========================================================
    # ML MODEL UNAVAILABLE
    # ========================================================

    if ml_result is None:

        result = _heuristic_prediction(
            features
        )

        result[
            "model_path"
        ] = str(
            MODEL_PATH
        )

        result[
            "analysis_inputs"
        ] = features

        result[
            "message"
        ] = (
            "Trained ML model was not found. "
            "Heuristic baseline used."
        )

        return result

    # ========================================================
    # ML EXECUTION FAILED
    # ========================================================

    if not ml_result.get(
        "model_available",
        False,
    ):

        result = _heuristic_prediction(
            features
        )

        result[
            "ml_error"
        ] = ml_result.get(
            "error"
        )

        result[
            "analysis_inputs"
        ] = features

        return result

    # ========================================================
    # SUCCESSFUL RANDOM FOREST PREDICTION
    # ========================================================

    prediction = (
        ml_result[
            "prediction"
        ]
    )

    risk_score = (
        ml_result[
            "risk_score"
        ]
    )

    risk_level = (
        ml_result[
            "risk_level"
        ]
    )

    class_probabilities = (
        ml_result.get(
            "class_probabilities",
            {},
        )
    )

    injury_results = []

    # --------------------------------------------------------
    # Build individual injury results
    # --------------------------------------------------------

    for injury in INJURY_CLASSES:

        probability = float(
            class_probabilities.get(
                injury,
                0.0,
            )
        )

        factors = _generate_risk_factors(
            injury,
            features,
        )

        injury_results.append(
            {
                "injury":
                    injury,

                "risk_score":
                    round(
                        probability,
                        2,
                    ),

                "risk_level":
                    _risk_level(
                        probability
                    ),

                "data_available":
                    True,

                "risk_factors":
                    factors,

                "prediction_method":
                    "random_forest",
            }
        )

    # --------------------------------------------------------
    # Sort highest risk first
    # --------------------------------------------------------

    injury_results.sort(
        key=lambda item:
        item["risk_score"],
        reverse=True,
    )

    highest_risk = (
        injury_results[0]
    )

    # --------------------------------------------------------
    # Overall risk factors
    # --------------------------------------------------------

    overall_risk_factors = []

    if features[
        "overall_anomaly_score"
    ] >= 40:

        overall_risk_factors.append(
            "Elevated overall movement anomaly detected."
        )

    if features[
        "knee_anomaly_score"
    ] >= 40:

        overall_risk_factors.append(
            "Abnormal knee movement detected."
        )

    if features[
        "hip_anomaly_score"
    ] >= 40:

        overall_risk_factors.append(
            "Abnormal hip movement detected."
        )

    if features[
        "elbow_anomaly_score"
    ] >= 40:

        overall_risk_factors.append(
            "Abnormal elbow movement detected."
        )

    if features[
        "knee_asymmetry_score"
    ] >= 40:

        overall_risk_factors.append(
            "Significant knee movement asymmetry detected."
        )

    if features[
        "hip_asymmetry_score"
    ] >= 40:

        overall_risk_factors.append(
            "Significant hip movement asymmetry detected."
        )

    if features[
        "elbow_asymmetry_score"
    ] >= 40:

        overall_risk_factors.append(
            "Significant elbow movement asymmetry detected."
        )

    if features[
        "movement_quality"
    ] < 60:

        overall_risk_factors.append(
            "Reduced movement quality detected."
        )

    if features[
        "balance_score"
    ] < 60:

        overall_risk_factors.append(
            "Reduced balance control detected."
        )

    if features[
        "symmetry_score"
    ] < 60:

        overall_risk_factors.append(
            "Reduced movement symmetry detected."
        )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {

        "analysis_available":
            True,

        "prediction_method":
            "random_forest",

        "model_available":
            True,

        "model_path":
            str(
                MODEL_PATH
            ),

        "predicted_injury":
            prediction,

        "risk_score":
            risk_score,

        "risk_level":
            risk_level,

        "highest_risk":
            highest_risk,

        "injury_risks":
            injury_results,

        "class_probabilities":
            class_probabilities,

        "overall_risk_score":
            risk_score,

        "overall_risk_level":
            risk_level,

        "risk_factors":
            overall_risk_factors,

        "analysis_inputs":
            features,
    }