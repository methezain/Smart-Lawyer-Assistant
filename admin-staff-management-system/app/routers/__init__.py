from fastapi import APIRouter
from .staff import router as staff_router
from .health import router as health_router
from .staff_auth import router as staff_auth_router

api_router = APIRouter()
api_router.include_router(staff_router)
api_router.include_router(staff_auth_router)
api_router.include_router(health_router)

__all__ = ["api_router"]
