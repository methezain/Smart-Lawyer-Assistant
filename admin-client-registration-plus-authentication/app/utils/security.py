import os
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "BjME82TQITFVLoKKNcIXZzM680uF3oH-bWJARfalNa4")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours instead of 30 minutes

def get_password_hash(password: str) -> str:
    """
    Hash a password for storing.
    
    Args:
        password (str): Plain text password
    
    Returns:
        str: Hashed password
    """
    # Truncate password to 72 bytes for bcrypt compatibility
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password = password_bytes[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password (str): Plain text password
        hashed_password (str): Hashed password
    
    Returns:
        bool: True if password matches hash, False otherwise
    """
    # Truncate password to 72 bytes for bcrypt compatibility
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        plain_password = password_bytes[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data (dict): Data to encode in the token
        expires_delta (timedelta, optional): Token expiration time
    
    Returns:
        str: Encoded JWT
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    """
    Decode a JWT token.
    
    Args:
        token (str): JWT token
    
    Returns:
        dict: Decoded payload or None if token is invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def is_token_expired(token: str) -> bool:
    """
    Check if a JWT token is expired.
    
    Args:
        token (str): JWT token
    
    Returns:
        bool: True if token is expired, False otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload.get('exp')
        if exp_timestamp:
            exp_datetime = datetime.fromtimestamp(exp_timestamp)
            return datetime.utcnow() > exp_datetime
        return True  # If no exp field, consider it expired
    except jwt.PyJWTError:
        return True  # If token is invalid, consider it expired

def get_token_expiry_time(token: str) -> datetime | None:
    """
    Get the expiry time of a JWT token.
    
    Args:
        token (str): JWT token
    
    Returns:
        datetime: Expiry time or None if token is invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload.get('exp')
        if exp_timestamp:
            return datetime.fromtimestamp(exp_timestamp)
        return None
    except jwt.PyJWTError:
        return None 