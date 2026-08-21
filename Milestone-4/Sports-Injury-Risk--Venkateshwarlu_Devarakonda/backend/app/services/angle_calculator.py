"""
Joint angle calculation utilities.

Calculates angle ABC using three 2D points:
A -> first point
B -> joint/vertex
C -> third point

Example:
calculate_angle(shoulder, elbow, wrist)
"""

from __future__ import annotations

import math
from typing import Sequence


Point2D = Sequence[float]


def calculate_angle(
    a: Point2D,
    b: Point2D,
    c: Point2D,
) -> float:
    """
    Calculate the angle ABC in degrees.

    Parameters
    ----------
    a : Point2D
        First point.
    b : Point2D
        Joint/vertex.
    c : Point2D
        Third point.

    Returns
    -------
    float
        Angle between 0 and 180 degrees.
    """

    if len(a) != 2 or len(b) != 2 or len(c) != 2:
        raise ValueError("All points must contain exactly 2 coordinates.")

    ax, ay = float(a[0]), float(a[1])
    bx, by = float(b[0]), float(b[1])
    cx, cy = float(c[0]), float(c[1])

    vector_ba = (
        ax - bx,
        ay - by,
    )

    vector_bc = (
        cx - bx,
        cy - by,
    )

    magnitude_ba = math.hypot(
        vector_ba[0],
        vector_ba[1],
    )

    magnitude_bc = math.hypot(
        vector_bc[0],
        vector_bc[1],
    )

    # Cannot calculate an angle if either vector has zero length.
    if magnitude_ba == 0.0 or magnitude_bc == 0.0:
        return 0.0

    dot_product = (
        vector_ba[0] * vector_bc[0]
        + vector_ba[1] * vector_bc[1]
    )

    cosine = dot_product / (
        magnitude_ba * magnitude_bc
    )

    # Floating-point protection.
    cosine = max(
        -1.0,
        min(1.0, cosine),
    )

    angle = math.degrees(
        math.acos(cosine)
    )

    return round(
        angle,
        2,
    )