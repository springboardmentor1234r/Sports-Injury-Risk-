"""
LIME (Local Interpretable Model-agnostic Explanations) for injury risk predictions.

LIME explains individual predictions by approximating the model locally
with an interpretable linear model.
"""
import numpy as np
from typing import Dict, Any, Optional

try:
    import lime
    import lime.lime_tabular
    LIME_AVAILABLE = True
except ImportError:
    LIME_AVAILABLE = False


class LimeExplainer:
    """LIME-based prediction explainer for injury risk models."""

    def __init__(self, training_data: np.ndarray, feature_names: list,
                 class_names: list = None):
        if not LIME_AVAILABLE:
            raise ImportError("lime is required: pip install lime")

        self.class_names = class_names or ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        self.feature_names = feature_names
        self.explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=training_data,
            feature_names=feature_names,
            class_names=self.class_names,
            mode='classification',
            discretize_continuous=True,
        )

    def explain_prediction(
        self,
        model_predict_fn,
        instance: np.ndarray,
        num_features: int = 10,
        num_samples: int = 1000,
    ) -> Dict[str, Any]:
        """
        Generate LIME explanation for a single prediction.

        Args:
            model_predict_fn: Function that takes (N, features) and returns (N, classes) probabilities
            instance: Single feature vector to explain
            num_features: Number of top features to include
            num_samples: Number of perturbation samples

        Returns:
            Dictionary with explanation details
        """
        explanation = self.explainer.explain_instance(
            instance,
            model_predict_fn,
            num_features=num_features,
            num_samples=num_samples,
        )

        # Extract feature contributions
        feature_weights = explanation.as_list()
        predicted_class = explanation.predict_proba.argmax() if hasattr(explanation, 'predict_proba') else 0

        return {
            'predicted_class': self.class_names[predicted_class],
            'prediction_probabilities': explanation.predict_proba.tolist() if hasattr(explanation, 'predict_proba') else [],
            'feature_contributions': [
                {'feature': feat, 'weight': float(weight)}
                for feat, weight in feature_weights
            ],
            'intercept': float(explanation.intercept[predicted_class]) if hasattr(explanation, 'intercept') else 0,
            'local_prediction': float(explanation.local_pred[0]) if hasattr(explanation, 'local_pred') else 0,
            'score': float(explanation.score) if hasattr(explanation, 'score') else 0,
        }

    def explain_batch(
        self,
        model_predict_fn,
        instances: np.ndarray,
        num_features: int = 10,
    ) -> list:
        """Generate LIME explanations for multiple instances."""
        return [
            self.explain_prediction(model_predict_fn, inst, num_features)
            for inst in instances
        ]
