"""
recommendation_engine.py
------------------------
Generates recommendations based on injury risk
predictions and detected movement anomalies.
"""

from .risk_scoring import RiskScoringEngine
from .anomaly_detector import MovementAnomalyDetector


class RecommendationEngine:

    def __init__(self, milestone2_output_folder):

        self.scoring = RiskScoringEngine(milestone2_output_folder)
        self.detector = MovementAnomalyDetector(milestone2_output_folder)

        self.report = self.scoring.generate_report()
        self.anomalies = self.detector.analyze()

    # ----------------------------------------------------------

    def generate(self):

        recommendations = []

        # Overall Risk
        overall = self.report["Overall Risk"]

        if overall == "CRITICAL":
            recommendations.append(
                "Immediate medical assessment is recommended before further physical activity."
            )

        elif overall == "HIGH":
            recommendations.append(
                "Reduce training intensity and consult a physiotherapist if symptoms persist."
            )

        elif overall == "MODERATE":
            recommendations.append(
                "Monitor movement quality and include corrective exercises."
            )

        else:
            recommendations.append(
                "Maintain current training routine with regular mobility work."
            )

        # Injury-specific recommendations
        predictions = self.report["Predictions"]

        if predictions["ACL Risk"] == "High":
            recommendations.append(
                "Include knee stability, balance, and quadriceps strengthening exercises."
            )

        if predictions["Hamstring Risk"] == "High":
            recommendations.append(
                "Increase hamstring flexibility and eccentric strengthening exercises."
            )

        if predictions["Shoulder Risk"] == "High":
            recommendations.append(
                "Improve shoulder mobility and rotator cuff strength."
            )

        # Movement anomaly recommendations
        if self.anomalies["Knee"] != "Normal":
            recommendations.append(
                "Address knee imbalance through unilateral strength training."
            )

        if self.anomalies["Hip"] != "Stable":
            recommendations.append(
                "Perform hip stability and glute activation exercises."
            )

        if self.anomalies["Shoulder"] != "Normal":
            recommendations.append(
                "Improve shoulder symmetry with posture and mobility drills."
            )

        if self.anomalies["Gait"] != "Normal":
            recommendations.append(
                "Perform gait retraining to improve walking/running mechanics."
            )

        return {
            "Overall Risk": overall,
            "Recommendations": recommendations
        }


if __name__ == "__main__":

    engine = RecommendationEngine("Milestone 2/outputs")

    result = engine.generate()

    print("\n========== RECOMMENDATIONS ==========\n")

    print("Overall Risk:", result["Overall Risk"])
    print()

    for i, rec in enumerate(result["Recommendations"], start=1):
        print(f"{i}. {rec}")