import matplotlib.pyplot as plt
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPORTS_DIR = os.path.join(BASE_DIR, "..", "reports")

def generate_graph(left_knees, right_knees):

    os.makedirs(REPORTS_DIR, exist_ok=True)

    plt.figure(figsize=(10, 5))

    plt.plot(left_knees, label="Left Knee")
    plt.plot(right_knees, label="Right Knee")

    plt.title("Knee Angle Analysis")
    plt.xlabel("Frame Number")
    plt.ylabel("Angle (Degrees)")

    plt.legend()

    plt.grid(True)

    plt.savefig(os.path.join(REPORTS_DIR, "knee_angle_graph.png"))

    plt.close()

    print("Graph Generated Successfully!")