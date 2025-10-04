from fastapi import APIRouter
from .hearings import router as hearings_router

# Create main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(hearings_router)

# Export the main router
__all__ = ["api_router"]
