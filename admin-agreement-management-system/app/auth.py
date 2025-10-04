import os
import jwt
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "BjME82TQITFVLoKKNcIXZzM680uF3oH-bWJARfalNa4")
ALGORITHM = "HS256"
security = HTTPBearer()

class JWTTokenData:
    def __init__(self, user_id: int, username: str, firm_id: int, user_type: str):
        self.user_id = user_id
        self.username = username
        self.firm_id = firm_id
        self.user_type = user_type

def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired", headers={"WWW-Authenticate": "Bearer"})
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}", headers={"WWW-Authenticate": "Bearer"})


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> JWTTokenData:
    payload = decode_jwt_token(credentials.credentials)
    try:
        user_id_str = payload.get("sub")
        user_id = int(user_id_str) if user_id_str else None
        username = payload.get("username")
        firm_id = payload.get("firm_id")
        user_type = payload.get("user_type", "admin")
        if not all([user_id, username, firm_id]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload - missing required fields", headers={"WWW-Authenticate": "Bearer"})
        return JWTTokenData(user_id, username, firm_id, user_type)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format", headers={"WWW-Authenticate": "Bearer"})


def get_current_admin_user(current_user: JWTTokenData = Depends(get_current_user)) -> JWTTokenData:
    if current_user.user_type != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def get_user_firm_filter(current_user: JWTTokenData = Depends(get_current_user)) -> int:
    return current_user.firm_id
