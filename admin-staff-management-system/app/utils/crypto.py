import base64
from typing import Optional


SECRET = b"sTaFf-pw-demo-key-2025"


def encrypt(text: str) -> str:
    if text is None:
        return ""
    data = text.encode("utf-8")
    xored = bytes(b ^ SECRET[i % len(SECRET)] for i, b in enumerate(data))
    return base64.urlsafe_b64encode(xored).decode("utf-8")


def decrypt(token: Optional[str]) -> str:
    if not token:
        return ""
    raw = base64.urlsafe_b64decode(token.encode("utf-8"))
    data = bytes(b ^ SECRET[i % len(SECRET)] for i, b in enumerate(raw))
    return data.decode("utf-8")
