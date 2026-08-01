"""
GRU model for injury risk prediction.

Gated Recurrent Unit is a simplified variant of LSTM with fewer parameters.
Uses reset and update gates instead of LSTM's input/forget/output gates.
Often performs comparably to LSTM with faster training.
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


class GRUNetwork(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 128, num_layers: int = 2, num_classes: int = 4):
        super().__init__()
        self.gru = nn.GRU(input_dim, hidden_dim, num_layers, batch_first=True, dropout=0.3, bidirectional=True)
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64), nn.ReLU(), nn.Dropout(0.4),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):
        _, h_n = self.gru(x)
        hidden = torch.cat((h_n[-2], h_n[-1]), dim=1)
        return self.classifier(hidden)


class GRUPredictor(BasePredictor):
    def __init__(self, config=None):
        super().__init__('GRU', config)
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required: pip install torch")
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.epochs = (config or {}).get('epochs', 50)
        self.batch_size = (config or {}).get('batch_size', 32)
        self.lr = (config or {}).get('learning_rate', 0.001)

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'GRUPredictor':
        input_dim = X.shape[2] if X.ndim == 3 else 66
        self.model = GRUNetwork(input_dim=input_dim).to(self.device)
        X_t = torch.FloatTensor(X).to(self.device)
        y_t = torch.LongTensor(y).to(self.device)
        loader = DataLoader(TensorDataset(X_t, y_t), batch_size=self.batch_size, shuffle=True)
        optimizer = optim.Adam(self.model.parameters(), lr=self.lr)
        criterion = nn.CrossEntropyLoss()

        self.model.train()
        for epoch in range(self.epochs):
            for X_batch, y_batch in loader:
                optimizer.zero_grad()
                loss = criterion(self.model(X_batch), y_batch)
                loss.backward()
                optimizer.step()
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        self.model.eval()
        with torch.no_grad():
            return self.model(torch.FloatTensor(X).to(self.device)).argmax(dim=1).cpu().numpy()

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        self.model.eval()
        with torch.no_grad():
            return torch.softmax(self.model(torch.FloatTensor(X).to(self.device)), dim=1).cpu().numpy()
