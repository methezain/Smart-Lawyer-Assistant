import json
from datetime import datetime

class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that can handle datetime objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def convert_datetime_to_iso(obj):
    """Convert datetime objects in a dictionary to ISO format strings."""
    if isinstance(obj, dict):
        return {k: convert_datetime_to_iso(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetime_to_iso(item) for item in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj 