from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = (
    BASE_DIR
    / "training"
    / "injury_training_data.csv"
)

MODEL_DIR = (
    BASE_DIR
    / "models"
)

MODEL_PATH = (
    MODEL_DIR
    / "injury_risk_model.joblib"
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


def main():

    print(
        "\n============================================================"
    )

    print(
        "SPORTS INJURY ML MODEL TRAINING"
    )

    print(
        "============================================================"
    )

    if not DATA_PATH.exists():

        raise FileNotFoundError(
            f"\nTraining dataset not found:\n"
            f"{DATA_PATH}\n\n"
            f"Run this first:\n"
            f"python training/create_training_dataset.py"
        )

    df = pd.read_csv(
        DATA_PATH
    )

    required_columns = (
        FEATURE_NAMES
        + ["injury_class"]
    )

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Missing training columns: "
            + ", ".join(
                missing_columns
            )
        )

    df = df.dropna(
        subset=required_columns
    )

    if len(df) < 100:

        raise ValueError(
            "Training dataset is too small."
        )

    if (
        df["injury_class"]
        .nunique()
        < 2
    ):

        raise ValueError(
            "At least two injury classes "
            "are required."
        )

    X = df[
        FEATURE_NAMES
    ]

    y = df[
        "injury_class"
    ]

    print(
        f"\nDataset rows: {len(df)}"
    )

    print(
        f"Features: {len(FEATURE_NAMES)}"
    )

    print(
        "\nClasses:"
    )

    print(
        y.value_counts()
    )

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y,
        )
    )

    print(
        f"\nTraining samples: "
        f"{len(X_train)}"
    )

    print(
        f"Testing samples: "
        f"{len(X_test)}"
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    print(
        "\nTraining Random Forest..."
    )

    model.fit(
        X_train,
        y_train,
    )

    predictions = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    print(
        "\n============================================================"
    )

    print(
        "MODEL EVALUATION"
    )

    print(
        "============================================================"
    )

    print(
        f"\nTest Accuracy: "
        f"{accuracy * 100:.2f}%"
    )

    print(
        "\nClassification Report:"
    )

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    print(
        "\nConfusion Matrix:"
    )

    print(
        confusion_matrix(
            y_test,
            predictions,
        )
    )

    print(
        "\nFeature Importance:"
    )

    importance = pd.Series(
        model.feature_importances_,
        index=FEATURE_NAMES,
    ).sort_values(
        ascending=False
    )

    print(
        importance
    )

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        model,
        MODEL_PATH,
    )

    print(
        "\n============================================================"
    )

    print(
        "MODEL SAVED"
    )

    print(
        "============================================================"
    )

    print(
        "\nModel path:"
    )

    print(
        MODEL_PATH
    )

    print(
        "\nML training completed successfully."
    )


if __name__ == "__main__":
    main()