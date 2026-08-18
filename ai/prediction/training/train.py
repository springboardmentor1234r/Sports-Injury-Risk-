"""
Training script for XGBoost model.
"""
from f.sport.ai.prediction.models.xgboost_model import InjuryRiskXGBoost
from f.sport.ai.prediction.training.data_generator import generate_synthetic_data

def train_pipeline():
    X, y = generate_synthetic_data(1000)
    model = InjuryRiskXGBoost()
    model.train(X, y)
    model.save("xgboost_model.json")
    print("Training complete.")

if __name__ == "__main__":
    train_pipeline()
