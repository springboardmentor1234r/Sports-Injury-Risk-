"""
Biomechanical analysis utilities.

These calculations are project-level indicators.
They are NOT clinically validated measurements.
"""

from typing import Optional


def _clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> float:

    return max(
        minimum,
        min(
            maximum,
            float(value),
        ),
    )


def calculate_rom(
    left_knee_average: float,
    right_knee_average: float,
    left_knee_min: Optional[float] = None,
    right_knee_min: Optional[float] = None,
    left_knee_max: Optional[float] = None,
    right_knee_max: Optional[float] = None,
) -> dict:
    """
    Calculate knee range of motion.

    ROM = maximum angle - minimum angle.
    """

    left_average = float(
        left_knee_average
    )

    right_average = float(
        right_knee_average
    )

    average_angle = (
        left_average
        + right_average
    ) / 2.0

    left_rom = 0.0
    right_rom = 0.0

    if (
        left_knee_min is not None
        and left_knee_max is not None
    ):
        left_rom = max(
            0.0,
            float(left_knee_max)
            - float(left_knee_min),
        )

    if (
        right_knee_min is not None
        and right_knee_max is not None
    ):
        right_rom = max(
            0.0,
            float(right_knee_max)
            - float(right_knee_min),
        )

    observed_values = [
        value
        for value in (
            left_rom,
            right_rom,
        )
        if value > 0
    ]

    observed_rom = (
        sum(observed_values)
        / len(observed_values)
        if observed_values
        else 0.0
    )

    # Average ROM interpretation.
    if observed_rom >= 120:
        status = "Excellent"

    elif observed_rom >= 90:
        status = "Good"

    elif observed_rom >= 60:
        status = "Limited"

    else:
        status = "Poor"

    return {
        "average_knee_angle": round(
            average_angle,
            2,
        ),
        "average_rom": round(
            observed_rom,
            2,
        ),
        "observed_rom": round(
            observed_rom,
            2,
        ),
        "left_rom": round(
            left_rom,
            2,
        ),
        "right_rom": round(
            right_rom,
            2,
        ),
        "status": status,
    }


def calculate_symmetry(
    left_angle: float,
    right_angle: float,
) -> dict:

    difference = abs(
        float(left_angle)
        - float(right_angle)
    )

    score = _clamp(
        100.0
        - (
            difference * 3.33
        )
    )

    if difference < 5:
        status = "Excellent"

    elif difference < 10:
        status = "Good"

    elif difference < 20:
        status = "Moderate"

    else:
        status = "Poor"

    return {
        "difference": round(
            difference,
            2,
        ),
        "symmetry_score": round(
            score,
            2,
        ),
        "status": status,
    }


def hip_stability(
    left_hip: float,
    right_hip: float,
) -> dict:

    difference = abs(
        float(left_hip)
        - float(right_hip)
    )

    if difference < 10:
        status = "Stable"

    elif difference < 20:
        status = "Moderate"

    else:
        status = "Poor"

    stability_score = _clamp(
        100.0
        - (
            difference * 3.33
        )
    )

    return {
        "difference": round(
            difference,
            2,
        ),
        "stability_score": round(
            stability_score,
            2,
        ),
        "status": status,
    }


def balance_score(
    left_knee: float,
    right_knee: float,
) -> float:

    difference = abs(
        float(left_knee)
        - float(right_knee)
    )

    score = _clamp(
        100.0
        - (
            difference * 3.33
        )
    )

    return round(
        score,
        2,
    )


def joint_alignment(
    left_knee: float,
    right_knee: float,
) -> str:

    difference = abs(
        float(left_knee)
        - float(right_knee)
    )

    if difference < 10:
        return "Normal"

    if difference < 20:
        return "Slight Deviation"

    return "Poor Alignment"


def calculate_movement_quality(
    balance: float,
    symmetry: float,
    risk_score: float,
) -> float:

    balance = _clamp(
        balance
    )

    symmetry = _clamp(
        symmetry
    )

    risk_score = _clamp(
        risk_score
    )

    quality = (
        balance * 0.40
        + symmetry * 0.40
        + (
            100.0 - risk_score
        ) * 0.20
    )

    return round(
        _clamp(
            quality
        ),
        2,
    )