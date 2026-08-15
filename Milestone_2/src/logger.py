import logging
import os
import sys

def get_logger(name: str) -> logging.Logger:
    """
    Creates and configures a centralized logger for the Sports Injury Risk project.
    Allows filtering by severity, preventing buffering issues, and standardizing output.
    """
    logger = logging.getLogger(name)
    
    # Only configure if it doesn't already have handlers to prevent duplicate logs
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Configure standard console output (stderr by default, which is standard for logs)
        ch = logging.StreamHandler(sys.stderr)
        ch.setLevel(logging.INFO)
        
        # Format: 2026-07-29 12:00:00,000 - src.module - INFO - message
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        ch.setFormatter(formatter)
        
        logger.addHandler(ch)
        
        # Prevent propagation to the root logger to avoid duplicate prints
        logger.propagate = False
        
    return logger
