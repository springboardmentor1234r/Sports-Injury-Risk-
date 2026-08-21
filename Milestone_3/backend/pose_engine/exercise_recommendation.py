def recommend_exercises(issues):

    recommendations = []

    for issue in issues:

        if issue == "Right Knee Over Flexion":
            recommendations.append(
                "Perform Quadriceps Strengthening Exercises"
            )

        elif issue == "Left Knee Over Flexion":
            recommendations.append(
                "Practice Hamstring Stretching"
            )

        elif issue == "Right Elbow Over Flexion":
            recommendations.append(
                "Reduce Arm Load and Perform Triceps Stretch"
            )

        elif issue == "Left Elbow Over Flexion":
            recommendations.append(
                "Improve Elbow Mobility Exercises"
            )

        elif issue == "Right Hip Instability":
            recommendations.append(
                "Perform Hip Bridge and Side Leg Raises"
            )

        elif issue == "Left Hip Instability":
            recommendations.append(
                "Strengthen Hip Abductor Muscles"
            )

    if len(recommendations) == 0:
        recommendations.append(
            "Continue Regular Training and Stretching"
        )

    return recommendations