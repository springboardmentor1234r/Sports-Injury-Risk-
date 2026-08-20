"""
SHAP Explainer for Model Interpretability.
"""
import shap
import pandas as pd
import matplotlib.pyplot as plt

class ShapExplainer:
    def __init__(self, model, X_train: pd.DataFrame):
        self.explainer = shap.TreeExplainer(model)
        self.expected_value = self.explainer.expected_value
        
    def explain_instance(self, instance: pd.DataFrame):
        shap_values = self.explainer.shap_values(instance)
        shap.force_plot(self.expected_value[0], shap_values[0], instance)
        plt.savefig('shap_plot.png')
