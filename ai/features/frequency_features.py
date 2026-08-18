"""
Frequency domain feature extraction using FFT.

Extracts spectral features from biomechanical signals to identify
periodic movement patterns and dominant frequencies.
"""
import numpy as np
from typing import Dict


def extract_frequency_features(signal: np.ndarray, fps: float = 30.0, prefix: str = '') -> Dict[str, float]:
    """
    Extract frequency domain features using Fast Fourier Transform.

    Args:
        signal: 1D time-domain signal
        fps: Sampling rate (frames per second)
        prefix: Feature name prefix

    Returns:
        Dictionary of frequency features
    """
    if len(signal) < 4:
        return {}

    p = f"{prefix}_" if prefix else ""
    n = len(signal)

    # FFT
    fft_vals = np.fft.rfft(signal - np.mean(signal))  # Remove DC component
    fft_magnitude = np.abs(fft_vals)
    fft_freqs = np.fft.rfftfreq(n, d=1.0 / fps)

    # Power spectral density
    psd = fft_magnitude ** 2 / n

    # Dominant frequency
    dominant_idx = np.argmax(fft_magnitude[1:]) + 1  # Skip DC
    dominant_freq = fft_freqs[dominant_idx]

    # Spectral energy
    total_energy = np.sum(psd)

    # Spectral entropy
    psd_norm = psd / total_energy if total_energy > 0 else psd
    psd_norm = psd_norm[psd_norm > 0]
    spectral_entropy = -np.sum(psd_norm * np.log2(psd_norm)) if len(psd_norm) > 0 else 0

    return {
        f'{p}dominant_freq': float(dominant_freq),
        f'{p}dominant_magnitude': float(fft_magnitude[dominant_idx]),
        f'{p}total_spectral_energy': float(total_energy),
        f'{p}spectral_entropy': float(spectral_entropy),
        f'{p}mean_frequency': float(np.sum(fft_freqs * psd) / total_energy) if total_energy > 0 else 0,
        f'{p}spectral_centroid': float(np.sum(fft_freqs * fft_magnitude) / np.sum(fft_magnitude)) if np.sum(fft_magnitude) > 0 else 0,
    }
