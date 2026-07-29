def calculate_rom(left_knee, right_knee):

    avg = (left_knee + right_knee) / 2

    if avg >= 150:
        status = "Excellent"

    elif avg >= 120:
        status = "Good"

    elif avg >= 90:
        status = "Limited"

    else:
        status = "Poor"

    return {
        "average_rom": round(avg, 2),
        "status": status
    }
     
def calculate_symmetry(left_angle, right_angle):

    difference = abs(left_angle - right_angle)

    score = max(0, 100 - difference)

    return {
        "difference": round(difference, 2),
        "symmetry_score": round(score, 2)
    }
    
def hip_stability(left_hip, right_hip):

    difference = abs(left_hip - right_hip)

    if difference < 10:
        status = "Stable"

    elif difference < 20:
        status = "Moderate"

    else:
        status = "Poor"

    return {
        "difference": round(difference, 2),
        "status": status
    }


def balance_score(left_knee, right_knee):

    difference = abs(left_knee - right_knee)

    score = max(0, 100 - difference)

    return round(score, 2)


def joint_alignment(left_knee, right_knee):

    difference = abs(left_knee - right_knee)

    if difference < 10:
        return "Normal"

    elif difference < 20:
        return "Slight Deviation"

    return "Poor Alignment"


def calculate_movement_quality(
    balance,
    symmetry,
    risk_score
):
    """
    Final movement quality score (0-100)
    """

    quality = (
        balance * 0.4
        + symmetry * 0.4
        + (100 - risk_score) * 0.2
    )

    return round(quality, 2)