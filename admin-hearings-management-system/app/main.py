from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import application components
from app.database import init_db
from app.routers import api_router
from app.schemas import ResponseBase

# API Configuration
API_V1_STR = os.getenv("API_V1_STR", "/api/v1")
PROJECT_NAME = os.getenv("PROJECT_NAME", "Smart Lawyer - Hearings Management Service")
PROJECT_VERSION = os.getenv("PROJECT_VERSION", "1.0.0")

# CORS Configuration
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS_ENV == '["*"]' or ALLOWED_ORIGINS_ENV == "*":
    ALLOWED_ORIGINS = ["*"]
elif ALLOWED_ORIGINS_ENV:
    ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]
else:
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager - handles startup and shutdown events
    """
    # Startup
    print("🚀 Starting Hearings Management Microservice...")
    
    # Initialize database
    try:
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise
    
    print(f"🎯 Server running on: http://localhost:8002")
    print(f"📚 API Documentation: http://localhost:8002/docs")
    print(f"🔧 Alternative docs: http://localhost:8002/redoc")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Hearings Management Microservice...")


# Create FastAPI application
app = FastAPI(
    title=PROJECT_NAME,
    version=PROJECT_VERSION,
    description="""
    **Smart Lawyer Hearings Management Microservice**
    
    A comprehensive REST API for managing court hearings and scheduling in a law firm.
    
    ## Features
    
    * **Hearing Management**: Create, read, update, and delete court hearings
    * **Case Integration**: Link hearings to specific cases
    * **Lawyer Assignment**: Assign lawyers to hearings
    * **Advanced Filtering**: Search and filter hearings with multiple criteria
    * **Pagination**: Efficient data retrieval with pagination support
    * **Calendar View**: Calendar-based hearing visualization
    * **Statistics**: Hearing statistics and dashboard data
    * **Upcoming Notifications**: Track upcoming hearings
    
    ## Hearing Types Supported
    
    * Initial Hearing, Arguments, Evidence, Final Hearing
    * Bail Hearing, Interim Application, Case Management
    * Settlement Conference, Mediation, Custom types
    
    ## Authentication
    
    This microservice is designed to be used behind an API gateway or with
    proper authentication middleware in a microservices architecture.
    Each hearing is associated with a firm for data isolation.
    """,
    contact={
        "name": "Smart Lawyer Development Team",
        "email": "dev@smartlawyer.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Global HTTP exception handler
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url),
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled exceptions
    """
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "status_code": 500,
            "path": str(request.url),
            "detail": str(exc) if os.getenv("DEBUG") == "True" else None
        }
    )


# Include API routers
app.include_router(api_router, prefix=API_V1_STR)


# Health check endpoint
@app.get("/health", response_model=ResponseBase, tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers
    """
    return ResponseBase(
        success=True,
        message="Hearings Management Service is healthy",
        data={
            "service": PROJECT_NAME,
            "version": PROJECT_VERSION,
            "status": "operational"
        }
    )


# Root endpoint
@app.get("/", response_model=ResponseBase, tags=["Root"])
async def read_root():
    """
    Root endpoint with service information
    """
    return ResponseBase(
        success=True,
        message="Welcome to Smart Lawyer Hearings Management API",
        data={
            "service": PROJECT_NAME,
            "version": PROJECT_VERSION,
            "docs": "/docs",
            "redoc": "/redoc",
            "api_prefix": API_V1_STR,
            "endpoints": {
                "hearings": f"{API_V1_STR}/hearings",
                "statistics": f"{API_V1_STR}/hearings/statistics",
                "upcoming": f"{API_V1_STR}/hearings/upcoming",
                "calendar": f"{API_V1_STR}/hearings/calendar/2025/8",
                "health": "/health"
            }
        }
    )


# Development server runner
if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting development server...")
    uvicorn.run(
        "main:app",
        host="localhost",
        port=8002,
        reload=True,
        log_level="info",
        reload_dirs=["app"],
        reload_includes=["*.py"]
    )
