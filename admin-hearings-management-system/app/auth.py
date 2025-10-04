"""
JWT Authentication utilities for Hearings Management System.
This module handles JWT token validation from the Admin Registration Service.
"""

import os
import jwt
import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)


# JWT settings - Must match the first service settings
SECRET_KEY = os.getenv("SECRET_KEY", "BjME82TQITFVLoKKNcIXZzM680uF3oH-bWJARfalNa4")
ALGORITHM = "HS256"

# Security scheme
security = HTTPBearer()


class JWTTokenData:
    """Class to hold JWT token data."""
    
    def __init__(self, user_id: int, username: str, firm_id: int, user_type: str):
        self.user_id = user_id
        self.username = username
        self.firm_id = firm_id
        self.user_type = user_type


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate JWT token.
    
    Args:
        token (str): JWT token string
        
    Returns:
        Optional[Dict[str, Any]]: Decoded payload or None if invalid
    """
    try:
        logger.info(f"Attempting to decode JWT token. Secret key starts with: {SECRET_KEY[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info(f"Successfully decoded token. Payload keys: {list(payload.keys())}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid JWT token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> JWTTokenData:
    """
    Dependency to get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Authorization credentials
        
    Returns:
        JWTTokenData: Current user data from token
        
    Raises:
        HTTPException: If token is invalid or missing required fields
    """
    logger.info("=== JWT TOKEN VALIDATION STARTED ===")
    logger.info(f"Received token (first 30 chars): {credentials.credentials[:30]}...")
    
    payload = decode_jwt_token(credentials.credentials)
    
    # Extract required fields from token
    try:
        user_id_str = payload.get("sub")
        user_id = int(user_id_str) if user_id_str else None
        username = payload.get("username")
        firm_id = payload.get("firm_id")
        user_type = payload.get("user_type", "admin")
        
        logger.info(f"=== EXTRACTED TOKEN DATA ===")
        logger.info(f"User ID: {user_id}")
        logger.info(f"Username: {username}")
        logger.info(f"Firm ID: {firm_id}")
        logger.info(f"User Type: {user_type}")
        logger.info(f"Raw firm_id from payload: {repr(payload.get('firm_id'))}")
        logger.info(f"=== TOKEN VALIDATION COMPLETE ===")
        
        if not all([user_id, username, firm_id]):
            logger.error(f"Missing required token fields - User ID: {user_id}, Username: {username}, Firm ID: {firm_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload - missing required fields",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return JWTTokenData(
            user_id=user_id,
            username=username,
            firm_id=firm_id,
            user_type=user_type
        )
        
    except (ValueError, TypeError) as e:
        logger.error(f"Error parsing token data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token format: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_admin_user(current_user: JWTTokenData = Depends(get_current_user)) -> JWTTokenData:
    """
    Dependency to ensure current user is an admin.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        JWTTokenData: Current admin user data
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user


def get_user_firm_filter(current_user: JWTTokenData = Depends(get_current_user)) -> int:
    """
    Dependency to get firm_id for filtering data by user's firm.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        int: Firm ID for filtering
    """
    return current_user.firm_id
