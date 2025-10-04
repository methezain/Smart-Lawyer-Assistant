from fastapi import APIRouter
from .cases import router as cases_router
from .health import router as health_router

# Create main API router
api_router = APIRouter()

# Include routers
api_router.include_router(cases_router)
api_router.include_router(health_router)

__all__ = ["api_router"]
