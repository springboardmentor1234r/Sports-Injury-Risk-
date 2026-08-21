import math

def calculate_angle(a, b, c):
    """
    Calculate the angle between three points.
    a, b, c are (x, y) coordinates.
    b is the joint where the angle is calculated.
    """

    angle = math.degrees(
        math.atan2(c[1] - b[1], c[0] - b[0]) -
        math.atan2(a[1] - b[1], a[0] - b[0])
    )

    if angle < 0:
        angle += 360

    if angle > 180:
        angle = 360 - angle

    return angle

if __name__ == "__main__":
    hip = (2, 2)
    knee = (2, 4)
    ankle = (4, 4)

    angle = calculate_angle(hip, knee, ankle)
    print(f"Knee Angle: {angle:.2f}°")
