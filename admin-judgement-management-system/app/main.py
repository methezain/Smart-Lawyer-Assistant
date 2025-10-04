from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.database import create_db_and_tables
from app.routers.judgments import router as judgments_router

API_V1_STR = os.getenv("API_V1_STR", "/api/v1")

app = FastAPI(
    title="Smart Lawyer - Judgments Management Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(judgments_router, prefix=API_V1_STR)

@app.get("/")
def root():
    return {
        "success": True,
        "message": "Judgments Management API",
        "endpoints": {
            "ocr": f"{API_V1_STR}/judgments/ocr",
        },
    }


# Development server runner
if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting development server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8004,
        reload=True,
        log_level="info",
        reload_dirs=["app"],
        reload_includes=["*.py"]
    )