import joblib
import os

BASE_DIR=os.path.dirname(os.path.abspath(__file__))

model=joblib.load(os.path.join(BASE_DIR,"../models/injury_model.pkl"))

def predict_injury(angles):

    features = [[
        angles["Left Knee"],
        angles["Right Knee"],
        angles["Left Elbow"],
        angles["Right Elbow"],
        angles["Left Hip"],
        angles["Right Hip"]
    ]]

    prediction=model.predict(features)[0]
    if prediction == 0:
        return "🟢 Safe"

    elif prediction == 1:
        return "🟡 Moderate Risk"

    else:
        return "🔴 High Risk"
        