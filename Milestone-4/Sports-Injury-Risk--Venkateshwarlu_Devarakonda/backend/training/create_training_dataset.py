from pathlib import Path

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]

OUTPUT_PATH = (
    BASE_DIR
    / "training"
    / "injury_training_data.csv"
)

RANDOM_SEED = 42

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

CLASSES = [
    "ACL Injury Risk",
    "Hamstring Injury Risk",
    "Ankle Sprain Risk",
    "Shoulder Injury Risk",
    "Lower Back Injury Risk",
    "Overuse Injury Risk",
]


def clipped_normal(
    rng,
    mean,
    std,
    size,
):
    return np.clip(
        rng.normal(
            mean,
            std,
            size,
        ),
        0,
        100,
    )


def create_class_data(
    rng,
    injury_class,
    samples,
):
    """
    Generate biomechanical feature patterns
    for project-level ML training.

    These are synthetic labelled samples.
    They are NOT clinical measurements.
    """

    overall = clipped_normal(
        rng,
        55,
        15,
        samples,
    )

    movement = clipped_normal(
        rng,
        55,
        14,
        samples,
    )

    balance = clipped_normal(
        rng,
        55,
        14,
        samples,
    )

    symmetry = clipped_normal(
        rng,
        55,
        14,
        samples,
    )

    knee = clipped_normal(
        rng,
        40,
        15,
        samples,
    )

    hip = clipped_normal(
        rng,
        40,
        15,
        samples,
    )

    elbow = clipped_normal(
        rng,
        35,
        15,
        samples,
    )

    knee_asymmetry = clipped_normal(
        rng,
        35,
        15,
        samples,
    )

    hip_asymmetry = clipped_normal(
        rng,
        35,
        15,
        samples,
    )

    elbow_asymmetry = clipped_normal(
        rng,
        30,
        15,
        samples,
    )

    if injury_class == "ACL Injury Risk":

        knee = clipped_normal(
            rng,
            78,
            10,
            samples,
        )

        knee_asymmetry = clipped_normal(
            rng,
            72,
            12,
            samples,
        )

        movement = clipped_normal(
            rng,
            42,
            12,
            samples,
        )

        symmetry = clipped_normal(
            rng,
            45,
            12,
            samples,
        )

        overall = clipped_normal(
            rng,
            68,
            12,
            samples,
        )

    elif injury_class == "Hamstring Injury Risk":

        hip = clipped_normal(
            rng,
            68,
            12,
            samples,
        )

        knee = clipped_normal(
            rng,
            60,
            12,
            samples,
        )

        hip_asymmetry = clipped_normal(
            rng,
            65,
            12,
            samples,
        )

        movement = clipped_normal(
            rng,
            45,
            12,
            samples,
        )

        overall = clipped_normal(
            rng,
            63,
            12,
            samples,
        )

    elif injury_class == "Ankle Sprain Risk":

        knee = clipped_normal(
            rng,
            62,
            12,
            samples,
        )

        balance = clipped_normal(
            rng,
            32,
            12,
            samples,
        )

        overall = clipped_normal(
            rng,
            64,
            12,
            samples,
        )

        symmetry = clipped_normal(
            rng,
            48,
            12,
            samples,
        )

        movement = clipped_normal(
            rng,
            44,
            12,
            samples,
        )

    elif injury_class == "Shoulder Injury Risk":

        elbow = clipped_normal(
            rng,
            76,
            10,
            samples,
        )

        elbow_asymmetry = clipped_normal(
            rng,
            70,
            12,
            samples,
        )

        movement = clipped_normal(
            rng,
            46,
            12,
            samples,
        )

        overall = clipped_normal(
            rng,
            61,
            12,
            samples,
        )

    elif injury_class == "Lower Back Injury Risk":

        hip = clipped_normal(
            rng,
            72,
            11,
            samples,
        )

        hip_asymmetry = clipped_normal(
            rng,
            68,
            12,
            samples,
        )

        movement = clipped_normal(
            rng,
            43,
            12,
            samples,
        )

        overall = clipped_normal(
            rng,
            65,
            12,
            samples,
        )

        symmetry = clipped_normal(
            rng,
            46,
            12,
            samples,
        )

    elif injury_class == "Overuse Injury Risk":

        overall = clipped_normal(
            rng,
            74,
            10,
            samples,
        )

        movement = clipped_normal(
            rng,
            38,
            11,
            samples,
        )

        symmetry = clipped_normal(
            rng,
            42,
            12,
            samples,
        )

        balance = clipped_normal(
            rng,
            44,
            12,
            samples,
        )

        knee = clipped_normal(
            rng,
            55,
            13,
            samples,
        )

        hip = clipped_normal(
            rng,
            55,
            13,
            samples,
        )

    return pd.DataFrame(
        {
            "overall_anomaly_score": overall,
            "movement_quality": movement,
            "balance_score": balance,
            "symmetry_score": symmetry,
            "knee_anomaly_score": knee,
            "hip_anomaly_score": hip,
            "elbow_anomaly_score": elbow,
            "knee_asymmetry_score": knee_asymmetry,
            "hip_asymmetry_score": hip_asymmetry,
            "elbow_asymmetry_score": elbow_asymmetry,
            "injury_class": injury_class,
        }
    )


def main():

    rng = np.random.default_rng(
        RANDOM_SEED
    )

    frames = []

    samples_per_class = 100

    for injury_class in CLASSES:

        frame = create_class_data(
            rng,
            injury_class,
            samples_per_class,
        )

        frames.append(frame)

    dataset = pd.concat(
        frames,
        ignore_index=True,
    )

    dataset[
        FEATURE_NAMES
    ] = dataset[
        FEATURE_NAMES
    ].round(2)

    dataset = dataset.sample(
        frac=1,
        random_state=RANDOM_SEED,
    ).reset_index(
        drop=True
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    dataset.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print(
        "\n============================================================"
    )

    print(
        "INJURY TRAINING DATASET CREATED"
    )

    print(
        "============================================================"
    )

    print(
        f"\nFile:"
    )

    print(
        OUTPUT_PATH
    )

    print(
        f"\nRows: {len(dataset)}"
    )

    print(
        f"Columns: {len(dataset.columns)}"
    )

    print(
        "\nClass distribution:"
    )

    print(
        dataset[
            "injury_class"
        ].value_counts()
    )

    print(
        "\nFirst 5 rows:"
    )

    print(
        dataset.head()
    )


if __name__ == "__main__":
    main()