"""
Temporal CNN model for injury risk prediction from pose sequences.

Uses 1D convolutions over temporal axis to capture movement patterns.
Architecture: Conv1D → BatchNorm → ReLU → MaxPool → ... → FC → Softmax

Input shape: (batch, sequence_length, num_features)
Output: Risk level probabilities (4 classes)
"""
import numpy as np
from .base_model import BasePredictor

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class TemporalCNNNetwork(nn.Module):
    """1D Temporal CNN for motion sequence classification."""

    def __init__(self, input_dim: int, seq_len: int, num_classes: int = 4):
        super().__init__()
        self.conv_layers = nn.Sequential(
            nn.Conv1d(input_dim, 64, kernel_size=3, padding=1),
            nn.BatchNorm1d(64), nn.ReLU(), nn.MaxPool1d(2),
            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm1d(128), nn.ReLU(), nn.MaxPool1d(2),
            nn.Conv1d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm1d(256), nn.ReLU(), nn.AdaptiveAvgPool1d(1),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128), nn.ReLU(), nn.Dropout(0.5),
            nn.Linear(128, 64), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):
        # x shape: (batch, seq_len, features) → transpose to (batch, features, seq_len)
        x = x.transpose(1, 2)
        x = self.conv_layers(x)
        return self.classifier(x)


class TemporalCNNPredictor(BasePredictor):
    """Temporal CNN predictor for sequential pose data."""

    def __init__(self, config=None):
        super().__init__('TemporalCNN', config)
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required: pip install torch")
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.epochs = (config or {}).get('epochs', 50)
        self.batch_size = (config or {}).get('batch_size', 32)
        self.lr = (config or {}).get('learning_rate', 0.001)
        self.input_dim = (config or {}).get('input_dim', 66)  # 33 landmarks * 2 (x,y)
        self.seq_len = (config or {}).get('seq_len', 30)  # 30 frames

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'TemporalCNNPredictor':
        """Train on sequences. X: (N, seq_len, features), y: (N,) integer labels."""
        self.model = TemporalCNNNetwork(
            input_dim=X.shape[2] if X.ndim == 3 else self.input_dim,
            seq_len=X.shape[1] if X.ndim == 3 else self.seq_len,
        ).to(self.device)

        X_t = torch.FloatTensor(X).to(self.device)
        y_t = torch.LongTensor(y).to(self.device)
        dataset = TensorDataset(X_t, y_t)
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

        optimizer = optim.Adam(self.model.parameters(), lr=self.lr, weight_decay=1e-4)
        criterion = nn.CrossEntropyLoss()
        scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=15, gamma=0.5)

        self.model.train()
        for epoch in range(self.epochs):
            total_loss = 0
            for X_batch, y_batch in loader:
                optimizer.zero_grad()
                output = self.model(X_batch)
                loss = criterion(output, y_batch)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
            scheduler.step()

        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        self.model.eval()
        with torch.no_grad():
            X_t = torch.FloatTensor(X).to(self.device)
            output = self.model(X_t)
            return output.argmax(dim=1).cpu().numpy()

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        self.model.eval()
        with torch.no_grad():
            X_t = torch.FloatTensor(X).to(self.device)
            output = torch.softmax(self.model(X_t), dim=1)
            return output.cpu().numpy()
