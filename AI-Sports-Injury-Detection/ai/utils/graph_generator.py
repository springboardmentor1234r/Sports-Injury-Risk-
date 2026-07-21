import matplotlib.pyplot as plt
import os


def generate_graph(left_knees, right_knees):

    os.makedirs("../reports", exist_ok=True)

    plt.figure(figsize=(10, 5))

    plt.plot(left_knees, label="Left Knee")
    plt.plot(right_knees, label="Right Knee")

    plt.title("Knee Angle Analysis")
    plt.xlabel("Frame Number")
    plt.ylabel("Angle (Degrees)")

    plt.legend()

    plt.grid(True)

    plt.savefig("../reports/knee_angle_graph.png")

    plt.close()

    print("Graph Generated Successfully!")