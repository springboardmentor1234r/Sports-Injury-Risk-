"""
Model evaluation and metrics for injury risk prediction.

Computes accuracy, precision, recall, F1, AUC-ROC, confusion matrix,
and generates comparison reports across all models.
"""
import numpy as np
from typing import Dict, Any, List
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    log_loss, cohen_kappa_score,
)
from sklearn.model_selection import cross_val_score


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray,
                   y_proba: np.ndarray = None,
                   class_names: List[str] = None) -> Dict[str, Any]:
    """
    Comprehensive model evaluation.

    Returns all standard classification metrics.
    """
    class_names = class_names or ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

    metrics = {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'precision_macro': float(precision_score(y_true, y_pred, average='macro', zero_division=0)),
        'recall_macro': float(recall_score(y_true, y_pred, average='macro', zero_division=0)),
        'f1_macro': float(f1_score(y_true, y_pred, average='macro', zero_division=0)),
        'precision_weighted': float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
        'recall_weighted': float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
        'f1_weighted': float(f1_score(y_true, y_pred, average='weighted', zero_division=0)),
        'cohen_kappa': float(cohen_kappa_score(y_true, y_pred)),
        'confusion_matrix': confusion_matrix(y_true, y_pred).tolist(),
        'classification_report': classification_report(y_true, y_pred, target_names=class_names, output_dict=True),
    }

    if y_proba is not None:
        try:
            metrics['roc_auc_ovr'] = float(roc_auc_score(y_true, y_proba, multi_class='ovr', average='macro'))
        except ValueError:
            metrics['roc_auc_ovr'] = 0.0
        metrics['log_loss'] = float(log_loss(y_true, y_proba))

    return metrics


def compare_models(results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compare evaluation results across multiple models.

    Returns ranking and best model recommendation.
    """
    comparison = []
    for name, metrics in results.items():
        comparison.append({
            'model': name,
            'accuracy': metrics['accuracy'],
            'f1_macro': metrics['f1_macro'],
            'precision_macro': metrics['precision_macro'],
            'recall_macro': metrics['recall_macro'],
            'roc_auc': metrics.get('roc_auc_ovr', 0),
        })

    # Sort by F1 macro score
    comparison.sort(key=lambda x: x['f1_macro'], reverse=True)

    return {
        'ranking': comparison,
        'best_model': comparison[0]['model'] if comparison else None,
        'best_f1': comparison[0]['f1_macro'] if comparison else 0,
    }
