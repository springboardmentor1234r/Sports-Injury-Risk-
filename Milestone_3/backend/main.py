"""
main.py
--------
Runs the complete Injury Prediction pipeline and
generates JSON reports.
"""

from .injury_prediction.predictor import InjuryPredictor
from .injury_prediction.risk_scoring import RiskScoringEngine
from .injury_prediction.anomaly_detector import MovementAnomalyDetector
from .injury_prediction.recommendation_engine import RecommendationEngine
from .injury_prediction.utils import ReportWriter


MILESTONE2_OUTPUT = "Milestone 2/outputs"
OUTPUT_FOLDER = "Milestone_3/outputs"


def main():
    # Initialize all modules
    predictor = InjuryPredictor(MILESTONE2_OUTPUT)
    scorer = RiskScoringEngine(MILESTONE2_OUTPUT)
    detector = MovementAnomalyDetector(MILESTONE2_OUTPUT)
    recommender = RecommendationEngine(MILESTONE2_OUTPUT)

    # Generate results
    predictions = predictor.predict()
    risk_report = scorer.generate_report()
    anomalies = detector.analyze()
    recommendations = recommender.generate()

    # Save JSON files
    writer = ReportWriter(OUTPUT_FOLDER)

    writer.save_json("prediction.json", predictions)
    writer.save_json("risk_report.json", risk_report)
    writer.save_json("anomalies.json", anomalies)
    writer.save_json("recommendations.json", recommendations)

    # Display summary
    print("\n" + "=" * 50)
    print("SPORTS INJURY RISK DETECTION PIPELINE COMPLETED")
    print("=" * 50)

    print("\nFiles Generated:")
    print("✓ prediction.json")
    print("✓ risk_report.json")
    print("✓ anomalies.json")
    print("✓ recommendations.json")

    print(f"\nOutput Directory: {OUTPUT_FOLDER}")


if __name__ == "__main__":
    main()