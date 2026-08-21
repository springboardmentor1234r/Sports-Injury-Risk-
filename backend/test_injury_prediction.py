from app.services.injury_prediction import predict_injury_risks


def main():
    anomaly_data = {
        "overall_anomaly_score": 58,

        "joint_analysis": {
            "left_knee": {
                "anomaly_score": 72
            },
            "right_knee": {
                "anomaly_score": 48
            },
            "left_hip": {
                "anomaly_score": 35
            },
            "right_hip": {
                "anomaly_score": 42
            },
            "left_elbow": {
                "anomaly_score": 20
            },
            "right_elbow": {
                "anomaly_score": 25
            },
        },

        "asymmetry_analysis": {
            "knee": {
                "asymmetry_score": 61
            },
            "hip": {
                "asymmetry_score": 38
            },
            "elbow": {
                "asymmetry_score": 22
            },
        },
    }

    biomechanics = {
        "movement_quality": 52,
        "balance_score": 46,
        "movement_symmetry": {
            "symmetry_score": 55
        },
    }

    result = predict_injury_risks(
        anomaly_data=anomaly_data,
        biomechanics=biomechanics,
    )

    print("\n" + "=" * 60)
    print("INJURY PREDICTION TEST")
    print("=" * 60)

    print("\nPrediction method:")
    print(result.get("prediction_method"))

    print("\nModel available:")
    print(result.get("model_available"))

    print("\nPredicted injury:")
    print(result.get("predicted_injury"))

    print("\nOverall risk score:")
    print(result.get("overall_risk_score"))

    print("\nOverall risk level:")
    print(result.get("overall_risk_level"))

    print("\nHighest risk:")
    print(result.get("highest_risk"))

    print("\nInjury risks:")

    for item in result.get("injury_risks", []):
        print(
            f"  {item['injury']}: "
            f"{item['risk_score']:.2f}% "
            f"({item['risk_level']})"
        )

    print("\nAnalysis inputs:")

    for key, value in result.get(
        "analysis_inputs",
        {}
    ).items():
        print(f"  {key}: {value}")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()