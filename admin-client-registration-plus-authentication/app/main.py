import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exception_handlers import http_exception_handler
from pathlib import Path
from datetime import datetime
import json

from app.api.routers import registration, auth, client_registration
from app.api.routers import login_activity
from app.models.database import create_db_and_tables
from app.models.client_database import create_client_db_and_tables
from app.schemas.registration import StandardResponse, ErrorDetail, ResponseStatus
from app.utils.json_encoder import CustomJSONEncoder

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_db_and_tables()
    create_client_db_and_tables()
    yield
    # Shutdown (if needed)

# Custom FastAPI class with a custom JSON encoder
class CustomFastAPI(FastAPI):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.json_encoder = CustomJSONEncoder

app = CustomFastAPI(
    title="SmartLawyer API",
    description="API for SmartLawyer Law Firm Registration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler for HTTPException
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Custom handler for HTTP exceptions to match our API response format."""
    response = StandardResponse(
        status=ResponseStatus.ERROR,
        message=exc.detail,
        timestamp=datetime.utcnow(),
        errors=[
            ErrorDetail(
                code="HTTP_ERROR",
                field=None,
                message=exc.detail
            )
        ],
        data=None
    )
    
    # Use model_dump instead of dict
    return JSONResponse(
        status_code=exc.status_code,
        content=json.loads(response.model_dump_json())
    )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to standardize error responses."""
    response = StandardResponse(
        status=ResponseStatus.ERROR,
        message=f"An unexpected error occurred: {str(exc)}",
        timestamp=datetime.utcnow(),
        errors=[
            ErrorDetail(
                code="SERVER_ERROR",
                field=None,
                message=str(exc)
            )
        ],
        data=None
    )
    
    # Use model_dump instead of dict
    return JSONResponse(
        status_code=500,
        content=json.loads(response.model_dump_json())
    )

# Create static directory for file uploads if it doesn't exist
UPLOAD_DIRECTORY = Path("uploads")
UPLOAD_DIRECTORY.mkdir(exist_ok=True)

# Mount static files directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(registration.router, prefix="/api/v1", tags=["Admin Registration"])
app.include_router(auth.router, prefix="/api/v1", tags=["Unified Authentication"])
app.include_router(client_registration.router, prefix="/api/v1", tags=["Client Registration"])
app.include_router(login_activity.router, prefix="/api/v1", tags=["Login Activity"])

# Database tables are now created via lifespan event handler

@app.get("/")
async def root():
    """Root endpoint returning API information."""
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Welcome to SmartLawyer Registration API",
        timestamp=datetime.utcnow(),
        data={
            "name": "Registration API",
            "version": "1.0.0",
            "docs_url": "/docs",
            "registration_endpoint": "/api/v1/registration/complete/"
        }
    )
    
    # Use model_dump instead of dict
    return JSONResponse(content=json.loads(response.model_dump_json()))
