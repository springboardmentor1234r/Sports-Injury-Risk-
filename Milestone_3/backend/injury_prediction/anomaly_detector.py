"""
anomaly_detector.py
-------------------
Detects movement anomalies using biomechanical outputs
generated during Milestone 2.
"""

from .utils import DataLoader, average, asymmetry


class MovementAnomalyDetector:

    def __init__(self, milestone2_output_folder):

        self.loader = DataLoader(milestone2_output_folder)

        self.joint_df = self.loader.load_joint_angles()

        self.gait_df = self.loader.load_gait_data()

    # ---------------------------------------------------------

    def detect_knee_imbalance(self):

        left = average(self.joint_df["left_knee"])
        right = average(self.joint_df["right_knee"])

        diff = asymmetry(left, right)

        if diff > 15:
            return "Severe Knee Imbalance"

        elif diff > 8:
            return "Moderate Knee Imbalance"

        return "Normal"

    # ---------------------------------------------------------

    def detect_hip_instability(self):

        left = average(self.joint_df["left_hip"])
        right = average(self.joint_df["right_hip"])

        diff = asymmetry(left, right)

        if diff > 12:
            return "Hip Instability"

        return "Stable"

    # ---------------------------------------------------------

    def detect_shoulder_imbalance(self):

        left = average(self.joint_df["left_shoulder"])
        right = average(self.joint_df["right_shoulder"])

        diff = asymmetry(left, right)

        if diff > 10:
            return "Shoulder Imbalance"

        return "Normal"

    # ---------------------------------------------------------

    def detect_gait_anomaly(self):

        if "left_phase" not in self.gait_df.columns or "right_phase" not in self.gait_df.columns:
            return "Unavailable"

        mismatch = (self.gait_df["left_phase"] != self.gait_df["right_phase"]).sum()

        if mismatch > len(self.gait_df) * 0.30:
            return "Abnormal Gait"

        elif mismatch > len(self.gait_df) * 0.15:
            return "Slight Gait Deviation"

        return "Normal"

    # ---------------------------------------------------------

    def analyze(self):

        return {

            "Knee": self.detect_knee_imbalance(),

            "Hip": self.detect_hip_instability(),

            "Shoulder": self.detect_shoulder_imbalance(),

            "Gait": self.detect_gait_anomaly()

        }


if __name__ == "__main__":

    detector = MovementAnomalyDetector("Milestone 2/outputs")

    results = detector.analyze()

    print("\n========== MOVEMENT ANOMALY REPORT ==========\n")

    for key, value in results.items():
        print(f"{key:15} : {value}")