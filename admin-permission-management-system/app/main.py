from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from app.database import init_db
from app.routers import api_router

load_dotenv()

API_V1_STR = os.getenv("API_V1_STR", "/api/v1")
PROJECT_NAME = os.getenv("PROJECT_NAME", "Smart Lawyer - Permission Management Service")
PROJECT_VERSION = os.getenv("PROJECT_VERSION", "1.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and create tables on startup
    init_db()
    yield

app = FastAPI(
    title=PROJECT_NAME,
    version=PROJECT_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,  # ensure init_db() runs at startup
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=API_V1_STR)

@app.get("/health")
async def health():
    return {"service": PROJECT_NAME, "status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8010, reload=True)
