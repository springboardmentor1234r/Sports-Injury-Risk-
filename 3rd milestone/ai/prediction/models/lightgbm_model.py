"""
LightGBM model for injury risk prediction.

LightGBM uses histogram-based gradient boosting with leaf-wise tree growth.
Faster training than XGBoost on large datasets, handles categorical features natively.
"""
import numpy as np
from .base_model import BasePredictor

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False


class LightGBMPredictor(BasePredictor):
    def __init__(self, config=None):
        super().__init__('LightGBM', config)
        if not LIGHTGBM_AVAILABLE:
            raise ImportError("lightgbm is required: pip install lightgbm")
        params = {
            'n_estimators': (config or {}).get('n_estimators', 300),
            'max_depth': (config or {}).get('max_depth', 10),
            'learning_rate': (config or {}).get('learning_rate', 0.05),
            'num_leaves': (config or {}).get('num_leaves', 31),
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'class_weight': 'balanced',
            'random_state': 42,
            'n_jobs': -1,
            'verbose': -1,
        }
        self.model = lgb.LGBMClassifier(**params)

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'LightGBMPredictor':
        self.model.fit(X, y)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)

    def get_feature_importance(self, importance_type: str = 'gain') -> np.ndarray:
        return self.model.feature_importances_
