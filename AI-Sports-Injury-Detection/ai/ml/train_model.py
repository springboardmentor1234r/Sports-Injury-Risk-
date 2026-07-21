import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load dataset
data = pd.read_csv("../dataset/injury_dataset.csv")

# Features (Inputs)
X = data[
    [
        "Left Knee",
        "Right Knee",
        "Left Elbow",
        "Right Elbow",
        "Left Hip",
        "Right Hip"
    ]
]

# Target (Output)
y = data["Risk"]

# Split dataset into Training and Testing
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Create Random Forest Model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# Train the model
model.fit(X_train, y_train)

# Test the model
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print(f"Model Accuracy : {accuracy*100:.2f}%")

# Save trained model
joblib.dump(model, "../models/injury_model.pkl")

print("Model Saved Successfully!")