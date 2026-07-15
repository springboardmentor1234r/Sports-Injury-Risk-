import pandas as pd


class FeatureExtractor:

    def __init__(self, csv_file):
        self.df = pd.read_csv(csv_file)

    def extract(self):

        features = {}

        # -----------------------------
        # Knee Features
        # -----------------------------

        for side in ["left", "right"]:

            col = f"{side}_knee"

            features[f"{side}_knee_mean"] = self.df[col].mean()
            features[f"{side}_knee_min"] = self.df[col].min()
            features[f"{side}_knee_max"] = self.df[col].max()
            features[f"{side}_knee_std"] = self.df[col].std()
            features[f"{side}_knee_rom"] = (
                self.df[col].max() - self.df[col].min()
            )

        # -----------------------------
        # Hip Features
        # -----------------------------

        for side in ["left", "right"]:

            col = f"{side}_hip"

            features[f"{side}_hip_mean"] = self.df[col].mean()
            features[f"{side}_hip_min"] = self.df[col].min()
            features[f"{side}_hip_max"] = self.df[col].max()
            features[f"{side}_hip_std"] = self.df[col].std()
            features[f"{side}_hip_rom"] = (
                self.df[col].max() - self.df[col].min()
            )

        # -----------------------------
        # Elbow Features
        # -----------------------------

        for side in ["left", "right"]:

            col = f"{side}_elbow"

            features[f"{side}_elbow_mean"] = self.df[col].mean()
            features[f"{side}_elbow_min"] = self.df[col].min()
            features[f"{side}_elbow_max"] = self.df[col].max()
            features[f"{side}_elbow_std"] = self.df[col].std()

        # -----------------------------
        # Shoulder Features
        # -----------------------------

        for side in ["left", "right"]:

            col = f"{side}_shoulder"

            features[f"{side}_shoulder_mean"] = self.df[col].mean()
            features[f"{side}_shoulder_min"] = self.df[col].min()
            features[f"{side}_shoulder_max"] = self.df[col].max()
            features[f"{side}_shoulder_std"] = self.df[col].std()

        return features


if __name__ == "__main__":

    CSV_PATH = "Milestone 3/outputs/running_joint_angles.csv"

    extractor = FeatureExtractor(CSV_PATH)

    features = extractor.extract()

    print("\n========== FEATURE VECTOR ==========\n")

    for key, value in features.items():
        print(f"{key:30} : {value:.2f}")

    print("\nTotal Features:", len(features))