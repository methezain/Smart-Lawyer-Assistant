from fastapi import APIRouter
from .permissions import router as permissions_router
from .health import router as health_router

api_router = APIRouter()
api_router.include_router(permissions_router)
api_router.include_router(health_router)

__all__ = ["api_router"]
