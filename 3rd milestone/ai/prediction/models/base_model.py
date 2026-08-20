"""
Base model interface for all injury risk prediction models.

All models must implement: fit(), predict(), predict_proba(), save(), load()
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import numpy as np
import joblib
import os


class BasePredictor(ABC):
    """Abstract base class for injury prediction models."""

    def __init__(self, name: str, config: Optional[Dict] = None):
        self.name = name
        self.config = config or {}
        self.model = None
        self.is_fitted = False
        self.feature_names: list = []
        self.classes = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

    @abstractmethod
    def fit(self, X: np.ndarray, y: np.ndarray) -> 'BasePredictor':
        """Train the model on features X and labels y."""
        pass

    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict risk level for input features."""
        pass

    @abstractmethod
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict probability distribution over risk levels."""
        pass

    def save(self, path: str) -> None:
        """Save model to disk."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'name': self.name,
            'config': self.config,
            'feature_names': self.feature_names,
            'is_fitted': self.is_fitted,
        }, path)

    def load(self, path: str) -> 'BasePredictor':
        """Load model from disk."""
        data = joblib.load(path)
        self.model = data['model']
        self.name = data['name']
        self.config = data['config']
        self.feature_names = data['feature_names']
        self.is_fitted = data['is_fitted']
        return self

    def get_risk_level(self, score: float) -> str:
        """Convert numeric score (0-100) to risk level string."""
        if score < 25:
            return 'LOW'
        elif score < 50:
            return 'MEDIUM'
        elif score < 75:
            return 'HIGH'
        return 'CRITICAL'

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name={self.name}, fitted={self.is_fitted})"
