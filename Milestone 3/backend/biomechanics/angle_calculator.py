import numpy as np


class AngleCalculator:
    """
    Utility class for calculating joint angles.
    """

    @staticmethod
    def calculate_angle(point1, point2, point3):

        a = np.array(point1)
        b = np.array(point2)
        c = np.array(point3)

        ba = a - b
        bc = c - b

        denominator = np.linalg.norm(ba) * np.linalg.norm(bc)

        if denominator == 0:
            return 0.0

        cosine = np.dot(ba, bc) / denominator
        cosine = np.clip(cosine, -1.0, 1.0)

        angle = np.degrees(np.arccos(cosine))

        return float(angle)


if __name__ == "__main__":

    calculator = AngleCalculator()

    print(
        calculator.calculate_angle(
            (1, 2),
            (2, 2),
            (3, 2)
        )
    )