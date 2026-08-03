import os
import sys

# Lets `pytest` be run from the repo root, backend/, or backend/tests/ and
# still resolve `import services...`, `import models`, etc.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
