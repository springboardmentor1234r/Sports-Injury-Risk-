"""
CatBoost model for injury risk prediction.

CatBoost uses ordered boosting and handles categorical features natively.
Generally requires less hyperparameter tuning than other gradient boosting methods.
"""
import numpy as np
from .base_model import BasePredictor

try:
    from catboost import CatBoostClassifier
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False


class CatBoostPredictor(BasePredictor):
    def __init__(self, config=None):
        super().__init__('CatBoost', config)
        if not CATBOOST_AVAILABLE:
            raise ImportError("catboost is required: pip install catboost")
        params = {
            'iterations': (config or {}).get('iterations', 500),
            'depth': (config or {}).get('depth', 8),
            'learning_rate': (config or {}).get('learning_rate', 0.05),
            'l2_leaf_reg': 3.0,
            'auto_class_weights': 'Balanced',
            'random_seed': 42,
            'verbose': 0,
            'task_type': 'CPU',
        }
        self.model = CatBoostClassifier(**params)

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'CatBoostPredictor':
        self.model.fit(X, y, verbose=0)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X).flatten()

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)

    def get_feature_importance(self) -> np.ndarray:
        return self.model.get_feature_importance()
