import numpy as np


class JointAngleCalculator:
    """
    Calculates joint angles from MediaPipe landmarks.
    """

    @staticmethod
    def calculate_angle(a, b, c):
        """
        Calculates the angle ABC (in degrees).

        Parameters:
            a, b, c -> (x, y) coordinates

        Returns:
            angle in degrees
        """

        a = np.array(a)
        b = np.array(b)
        c = np.array(c)

        ba = a - b
        bc = c - b

        cosine = np.dot(ba, bc) / (
            np.linalg.norm(ba) * np.linalg.norm(bc)
        )

        cosine = np.clip(cosine, -1.0, 1.0)

        angle = np.degrees(np.arccos(cosine))

        return angle


if __name__ == "__main__":

    calculator = JointAngleCalculator()

    hip = (1, 2)
    knee = (2, 2)
    ankle = (3, 2)

    angle = calculator.calculate_angle(
        hip,
        knee,
        ankle
    )

    print("\nKnee Angle:", angle)