"""
Authentication middleware for Case Management System.
Provides global authentication handling and proper error responses.
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class AuthenticationMiddleware:
    """Middleware to handle authentication errors globally."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Skip authentication for certain paths
        path = request.url.path
        skip_auth_paths = [
            "/docs",
            "/redoc", 
            "/openapi.json",
            "/health",
            "/favicon.ico"
        ]
        
        if any(path.startswith(skip_path) for skip_path in skip_auth_paths):
            await self.app(scope, receive, send)
            return
        
        try:
            await self.app(scope, receive, send)
        except HTTPException as e:
            if e.status_code == status.HTTP_401_UNAUTHORIZED:
                # Log authentication failures
                logger.warning(f"Authentication failed for path: {path}")
                
                response = JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={
                        "success": False,
                        "message": "Authentication required",
                        "detail": e.detail,
                        "error_code": "AUTHENTICATION_REQUIRED"
                    },
                    headers={"WWW-Authenticate": "Bearer"}
                )
                await response(scope, receive, send)
            elif e.status_code == status.HTTP_403_FORBIDDEN:
                # Log authorization failures
                logger.warning(f"Authorization failed for path: {path}")
                
                response = JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "success": False,
                        "message": "Insufficient permissions",
                        "detail": e.detail,
                        "error_code": "INSUFFICIENT_PERMISSIONS"
                    }
                )
                await response(scope, receive, send)
            else:
                # Re-raise other HTTP exceptions
                raise e


def add_auth_middleware(app):
    """Add authentication middleware to the app."""
    app.middleware("http")(AuthenticationMiddleware(app))
