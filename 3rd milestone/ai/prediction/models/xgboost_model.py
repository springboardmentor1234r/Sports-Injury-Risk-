"""
XGBoost Predictor Model for Injury Risk.
Primary model for the platform.
"""
import numpy as np
import pandas as pd
import xgboost as xgb
from typing import Dict, Any, List

class InjuryRiskXGBoost:
    """
    XGBoost classifier for injury risk prediction.
    """
    def __init__(self, model_path: str = None):
        self.model = xgb.XGBClassifier(
            objective="multi:softprob",
            num_class=4,  # LOW, MEDIUM, HIGH, CRITICAL
            eval_metric="mlogloss",
            use_label_encoder=False
        )
        if model_path:
            self.model.load_model(model_path)
            
    def train(self, X_train: pd.DataFrame, y_train: pd.Series, X_val: pd.DataFrame = None, y_val: pd.Series = None):
        """Train the model."""
        eval_set = [(X_train, y_train)]
        if X_val is not None and y_val is not None:
            eval_set.append((X_val, y_val))
            
        self.model.fit(
            X_train, y_train,
            eval_set=eval_set,
            early_stopping_rounds=10,
            verbose=False
        )
        
    def predict_risk(self, features: pd.DataFrame) -> List[Dict[str, float]]:
        """
        Predict injury risk probabilities.
        Returns: List of dicts mapping risk level to probability.
        """
        probs = self.model.predict_proba(features)
        labels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        
        results = []
        for prob in probs:
            risk_dict = {labels[i]: float(prob[i]) for i in range(len(labels))}
            results.append(risk_dict)
            
        return results
        
    def save(self, path: str):
        self.model.save_model(path)
