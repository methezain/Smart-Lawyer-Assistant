from fastapi import APIRouter, Depends
from datetime import datetime
from app.auth import get_current_user, JWTTokenData

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Staff Registration Service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@router.get("/auth-status")
async def auth_status(current_user: JWTTokenData = Depends(get_current_user)):
    return {
        "status": "authenticated",
        "user": {
            "id": current_user.user_id,
            "username": current_user.username,
            "firm_id": current_user.firm_id,
            "user_type": current_user.user_type,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }
