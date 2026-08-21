import numpy as np


def convert_to_json(obj):
    if isinstance(obj, dict):
        return {
            key: convert_to_json(value)
            for key, value in obj.items()
        }

    if isinstance(obj, (list, tuple)):
        return [
            convert_to_json(item)
            for item in obj
        ]

    if isinstance(obj, np.integer):
        return int(obj)

    if isinstance(obj, np.floating):
        return float(obj)

    if isinstance(obj, np.bool_):
        return bool(obj)

    if isinstance(obj, np.ndarray):
        return obj.tolist()

    return obj