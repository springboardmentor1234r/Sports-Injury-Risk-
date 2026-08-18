"""
Hyperparameter tuning using Optuna for injury risk prediction models.
"""
import numpy as np
from typing import Dict, Any, Optional

try:
    import optuna
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False

from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb


def tune_xgboost(X: np.ndarray, y: np.ndarray, n_trials: int = 50) -> Dict[str, Any]:
    """Tune XGBoost hyperparameters with Optuna."""
    if not OPTUNA_AVAILABLE:
        return {'n_estimators': 300, 'max_depth': 8, 'learning_rate': 0.05}

    def objective(trial):
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 100, 500),
            'max_depth': trial.suggest_int('max_depth', 3, 12),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            'gamma': trial.suggest_float('gamma', 0, 5),
            'reg_alpha': trial.suggest_float('reg_alpha', 0, 2),
            'reg_lambda': trial.suggest_float('reg_lambda', 0, 2),
        }
        model = xgb.XGBClassifier(**params, use_label_encoder=False, eval_metric='mlogloss', random_state=42)
        scores = cross_val_score(model, X, y, cv=5, scoring='f1_macro', n_jobs=-1)
        return scores.mean()

    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    return {
        'best_params': study.best_params,
        'best_score': study.best_value,
        'n_trials': n_trials,
    }


def tune_random_forest(X: np.ndarray, y: np.ndarray, n_trials: int = 30) -> Dict[str, Any]:
    """Tune Random Forest hyperparameters with Optuna."""
    if not OPTUNA_AVAILABLE:
        return {'n_estimators': 200, 'max_depth': 15}

    def objective(trial):
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 50, 500),
            'max_depth': trial.suggest_int('max_depth', 5, 25),
            'min_samples_split': trial.suggest_int('min_samples_split', 2, 15),
            'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
            'max_features': trial.suggest_categorical('max_features', ['sqrt', 'log2']),
        }
        model = RandomForestClassifier(**params, class_weight='balanced', random_state=42, n_jobs=-1)
        scores = cross_val_score(model, X, y, cv=5, scoring='f1_macro', n_jobs=-1)
        return scores.mean()

    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    return {
        'best_params': study.best_params,
        'best_score': study.best_value,
    }
