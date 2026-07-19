"""
utils.py
---------
Utility functions for Milestone 3 Injury Prediction Engine.

This module provides:
1. Loading CSV outputs from Milestone 2
2. Saving JSON reports
3. Basic statistical calculations
4. Data validation
"""

from pathlib import Path
import json
import pandas as pd


class DataLoader:
    """
    Loads biomechanical outputs generated in Milestone 2.
    """

    def __init__(self, milestone2_outputs: str):
        self.output_path = Path(milestone2_outputs)

    def load_joint_angles(self) -> pd.DataFrame:
        file_path = self.output_path / "running_joint_angles.csv"

        if not file_path.exists():
            raise FileNotFoundError(
                f"Joint angle file not found:\n{file_path}"
            )

        return pd.read_csv(file_path)

    def load_gait_data(self) -> pd.DataFrame:
        file_path = self.output_path / "running_gait.csv"

        if not file_path.exists():
            raise FileNotFoundError(
                f"Gait file not found:\n{file_path}"
            )

        return pd.read_csv(file_path)


class ReportWriter:
    """
    Writes prediction results into JSON files.
    """

    def __init__(self, output_directory: str):
        self.output_directory = Path(output_directory)
        self.output_directory.mkdir(parents=True, exist_ok=True)

    def save_json(self, filename: str, data: dict):

        output_file = self.output_directory / filename

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

        print(f"[INFO] Saved: {output_file}")


def average(series: pd.Series) -> float:
    return round(float(series.mean()), 2)


def asymmetry(left: float, right: float) -> float:
    """
    Percentage difference between left and right side.
    """

    if left + right == 0:
        return 0

    return round(abs(left - right) / ((left + right) / 2) * 100, 2)


REQUIRED_COLUMNS = [
    "left_knee",
    "right_knee",
    "left_hip",
    "right_hip",
    "left_shoulder",
    "right_shoulder"
]