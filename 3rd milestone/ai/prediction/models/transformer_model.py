"""
Transformer Encoder model for injury risk prediction from temporal sequences.

Uses multi-head self-attention to capture long-range dependencies in movement data.
Positional encoding enables the model to understand temporal ordering.

Architecture: Positional Encoding → Transformer Encoder → Global Avg Pool → FC → Softmax
"""
import numpy as np
import math
from .base_model import BasePredictor

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding for temporal sequence ordering."""
    def __init__(self, d_model: int, max_len: int = 500):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term[:d_model // 2])  # handle odd d_model
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)

    def forward(self, x):
        return x + self.pe[:, :x.size(1)]


class TransformerEncoderNetwork(nn.Module):
    """Transformer Encoder for motion sequence classification."""
    def __init__(self, input_dim: int, d_model: int = 128, nhead: int = 4,
                 num_layers: int = 3, num_classes: int = 4):
        super().__init__()
        self.input_proj = nn.Linear(input_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead, dim_feedforward=256,
            dropout=0.1, batch_first=True, activation='gelu',
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.classifier = nn.Sequential(
            nn.LayerNorm(d_model),
            nn.Linear(d_model, 64), nn.GELU(), nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):
        x = self.input_proj(x)
        x = self.pos_encoder(x)
        x = self.transformer(x)
        x = x.mean(dim=1)  # Global average pooling over sequence
        return self.classifier(x)


class TransformerPredictor(BasePredictor):
    def __init__(self, config=None):
        super().__init__('Transformer', config)
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required: pip install torch")
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.epochs = (config or {}).get('epochs', 60)
        self.batch_size = (config or {}).get('batch_size', 32)
        self.lr = (config or {}).get('learning_rate', 0.0005)

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'TransformerPredictor':
        input_dim = X.shape[2] if X.ndim == 3 else 66
        self.model = TransformerEncoderNetwork(input_dim=input_dim).to(self.device)
        X_t = torch.FloatTensor(X).to(self.device)
        y_t = torch.LongTensor(y).to(self.device)
        loader = DataLoader(TensorDataset(X_t, y_t), batch_size=self.batch_size, shuffle=True)

        optimizer = optim.AdamW(self.model.parameters(), lr=self.lr, weight_decay=0.01)
        criterion = nn.CrossEntropyLoss()
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=self.epochs)

        self.model.train()
        for epoch in range(self.epochs):
            for X_batch, y_batch in loader:
                optimizer.zero_grad()
                loss = criterion(self.model(X_batch), y_batch)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                optimizer.step()
            scheduler.step()
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
