"""
Random Forest model for injury risk prediction.

Random Forest is an ensemble of decision trees using bagging.
It's robust against overfitting and provides feature importance rankings.
"""
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from .base_model import BasePredictor


class RandomForestPredictor(BasePredictor):
    def __init__(self, config=None):
        super().__init__('RandomForest', config)
        self.model = RandomForestClassifier(
            n_estimators=config.get('n_estimators', 200),
            max_depth=config.get('max_depth', 15),
            min_samples_split=config.get('min_samples_split', 5),
            min_samples_leaf=config.get('min_samples_leaf', 2),
            max_features=config.get('max_features', 'sqrt'),
            class_weight='balanced',
            random_state=42,
            n_jobs=-1,
        ) if config else RandomForestClassifier(
            n_estimators=200, max_depth=15, class_weight='balanced',
            random_state=42, n_jobs=-1,
        )

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'RandomForestPredictor':
        self.model.fit(X, y)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)

    def get_feature_importance(self) -> np.ndarray:
        """Get feature importance scores from the trained forest."""
        return self.model.feature_importances_
