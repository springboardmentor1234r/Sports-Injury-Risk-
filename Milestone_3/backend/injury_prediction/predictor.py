"""
predictor.py
------------
Rule-based Injury Prediction Engine

This module analyses biomechanical data generated in
Milestone 2 and predicts possible injury risks.
"""

from .utils import DataLoader, average, asymmetry

class InjuryPredictor:
    """
    Rule-based Injury Prediction Engine.
    """

    def __init__(self, milestone2_output_folder):

        self.loader = DataLoader(milestone2_output_folder)

        self.joint_df = self.loader.load_joint_angles()
        self.gait_df = self.loader.load_gait_data()

    # ----------------------------------------------------

    def predict_acl_risk(self):

        left = average(self.joint_df["left_knee"])
        right = average(self.joint_df["right_knee"])

        avg = (left + right) / 2

        if avg < 145:
            return "High"

        elif avg < 160:
            return "Moderate"

        return "Low"

    # ----------------------------------------------------

    def predict_hamstring_risk(self):

        left = average(self.joint_df["left_hip"])
        right = average(self.joint_df["right_hip"])

        avg = (left + right) / 2

        if avg > 175:
            return "High"

        elif avg > 165:
            return "Moderate"

        return "Low"

    # ----------------------------------------------------

    def predict_shoulder_risk(self):

        left = average(self.joint_df["left_shoulder"])
        right = average(self.joint_df["right_shoulder"])

        avg = (left + right) / 2

        if avg < 15:
            return "High"

        elif avg < 25:
            return "Moderate"

        return "Low"

    # ----------------------------------------------------

    def predict_gait_symmetry(self):

        left = average(self.joint_df["left_knee"])
        right = average(self.joint_df["right_knee"])

        diff = asymmetry(left, right)

        if diff > 15:
            return "Poor"

        elif diff > 8:
            return "Average"

        return "Good"

    # ----------------------------------------------------

    def predict(self):

        return {

            "ACL Risk": self.predict_acl_risk(),

            "Hamstring Risk": self.predict_hamstring_risk(),

            "Shoulder Risk": self.predict_shoulder_risk(),

            "Gait Symmetry": self.predict_gait_symmetry()

        }


if __name__ == "__main__":

    predictor = InjuryPredictor("Milestone 2/outputs")

    predictions = predictor.predict()

    print("\n========== Injury Prediction ==========\n")

    for injury, value in predictions.items():
        print(f"{injury:20} : {value}")