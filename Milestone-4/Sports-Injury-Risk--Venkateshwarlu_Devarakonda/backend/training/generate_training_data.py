from pathlib import Path

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]

OUTPUT_PATH = (
    BASE_DIR
    / "training"
    / "injury_training_data.csv"
)

FEATURE_NAMES = [
    "overall_anomaly_score",
    "movement_quality",
    "balance_score",
    "symmetry_score",
    "knee_anomaly_score",
    "hip_anomaly_score",
    "elbow_anomaly_score",
    "knee_asymmetry_score",
    "hip_asymmetry_score",
    "elbow_asymmetry_score",
]

INJURY_CLASSES = [
    "ACL Injury Risk",
    "Hamstring Injury Risk",
    "Ankle Sprain Risk",
    "Shoulder Injury Risk",
    "Lower Back Injury Risk",
    "Overuse Injury Risk",
]


def clamp(value):
    return round(
        float(
            np.clip(
                value,
                0,
                100,
            )
        ),
        2,
    )


def generate_row(rng):

    injury = rng.choice(
        INJURY_CLASSES
    )

    # Base biomechanical values
    overall_anomaly = rng.uniform(
        10,
        80,
    )

    movement_quality = rng.uniform(
        25,
        95,
    )

    balance_score = rng.uniform(
        30,
        95,
    )

    symmetry_score = rng.uniform(
        30,
        95,
    )

    knee_anomaly = rng.uniform(
        5,
        80,
    )

    hip_anomaly = rng.uniform(
        5,
        80,
    )

    elbow_anomaly = rng.uniform(
        5,
        80,
    )

    knee_asymmetry = rng.uniform(
        5,
        75,
    )

    hip_asymmetry = rng.uniform(
        5,
        75,
    )

    elbow_asymmetry = rng.uniform(
        5,
        75,
    )

    # Create class-specific patterns.
    #
    # These patterns are synthetic and are only
    # intended for demonstrating the ML pipeline.

    if injury == "ACL Injury Risk":

        knee_anomaly += rng.uniform(
            15,
            30,
        )

        knee_asymmetry += rng.uniform(
            15,
            30,
        )

        movement_quality -= rng.uniform(
            10,
            25,
        )

        symmetry_score -= rng.uniform(
            10,
            20,
        )

    elif injury == "Hamstring Injury Risk":

        hip_anomaly += rng.uniform(
            10,
            25,
        )

        knee_anomaly += rng.uniform(
            10,
            20,
        )

        hip_asymmetry += rng.uniform(
            15,
            25,
        )

        movement_quality -= rng.uniform(
            10,
            20,
        )

    elif injury == "Ankle Sprain Risk":

        knee_anomaly += rng.uniform(
            10,
            25,
        )

        balance_score -= rng.uniform(
            20,
            35,
        )

        overall_anomaly += rng.uniform(
            10,
            25,
        )

        movement_quality -= rng.uniform(
            10,
            20,
        )

    elif injury == "Shoulder Injury Risk":

        elbow_anomaly += rng.uniform(
            15,
            30,
        )

        elbow_asymmetry += rng.uniform(
            15,
            30,
        )

        movement_quality -= rng.uniform(
            10,
            20,
        )

    elif injury == "Lower Back Injury Risk":

        hip_anomaly += rng.uniform(
            15,
            30,
        )

        hip_asymmetry += rng.uniform(
            15,
            30,
        )

        movement_quality -= rng.uniform(
            10,
            25,
        )

        symmetry_score -= rng.uniform(
            5,
            20,
        )

    elif injury == "Overuse Injury Risk":

        overall_anomaly += rng.uniform(
            15,
            30,
        )

        movement_quality -= rng.uniform(
            15,
            30,
        )

        symmetry_score -= rng.uniform(
            10,
            25,
        )

        balance_score -= rng.uniform(
            5,
            20,
        )

    return {
        "overall_anomaly_score":
            clamp(overall_anomaly),

        "movement_quality":
            clamp(movement_quality),

        "balance_score":
            clamp(balance_score),

        "symmetry_score":
            clamp(symmetry_score),

        "knee_anomaly_score":
            clamp(knee_anomaly),

        "hip_anomaly_score":
            clamp(hip_anomaly),

        "elbow_anomaly_score":
            clamp(elbow_anomaly),

        "knee_asymmetry_score":
            clamp(knee_asymmetry),

        "hip_asymmetry_score":
            clamp(hip_asymmetry),

        "elbow_asymmetry_score":
            clamp(elbow_asymmetry),

        "injury_class":
            injury,
    }


def main():

    rng = np.random.default_rng(
        42
    )

    rows = []

    # 600 labelled samples
    for _ in range(600):

        rows.append(
            generate_row(
                rng
            )
        )

    df = pd.DataFrame(
        rows
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    df.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print(
        "\nTraining dataset created:"
    )

    print(
        OUTPUT_PATH
    )

    print(
        f"\nTotal samples: {len(df)}"
    )

    print(
        "\nClass distribution:"
    )

    print(
        df["injury_class"]
        .value_counts()
    )


if __name__ == "__main__":
    main()