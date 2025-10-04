"""
Health and system status endpoints for Case Management System.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from app.auth import get_current_user, JWTTokenData
from app.database import get_session
from sqlmodel import Session, text

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint - no authentication required."""
    return {
        "status": "healthy",
        "service": "Case Management System",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@router.get("/auth/status")
async def auth_status(current_user: JWTTokenData = Depends(get_current_user)):
    """Check authentication status and return user info."""
    return {
        "authenticated": True,
        "user_id": current_user.user_id,
        "username": current_user.username,
        "firm_id": current_user.firm_id,
        "user_type": current_user.user_type,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/auth/verify")
async def verify_database_connection(
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Verify database connection and authentication."""
    try:
        # Test database connection
        result = session.exec(text("SELECT 1")).first()
        
        return {
            "status": "verified",
            "database_connected": True,
            "authenticated": True,
            "user_info": {
                "user_id": current_user.user_id,
                "username": current_user.username,
                "firm_id": current_user.firm_id,
                "user_type": current_user.user_type
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )
