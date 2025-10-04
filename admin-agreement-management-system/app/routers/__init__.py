from fastapi import APIRouter
from .agreements import router as agreements_router

api_router = APIRouter()
api_router.include_router(agreements_router)

__all__ = ["api_router"]
