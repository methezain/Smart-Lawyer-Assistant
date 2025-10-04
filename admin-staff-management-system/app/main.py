from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from app.database import init_db
from app.routers import api_router
from app.schema import ResponseBase

API_V1_STR = os.getenv("API_V1_STR", "/api/v1")
PROJECT_NAME = os.getenv("PROJECT_NAME", "Smart Lawyer - Staff Registration Service")
PROJECT_VERSION = os.getenv("PROJECT_VERSION", "1.0.0")

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
		"http://127.0.0.1:5173",
	]


@asynccontextmanager
async def lifespan(app: FastAPI):
	print("🚀 Starting Staff Registration Microservice...")
	try:
		init_db()
		print("✅ Database initialized successfully")
	except Exception as e:
		print(f"❌ Database initialization failed: {e}")
		raise
	yield
	print("🛑 Shutting down Staff Registration Microservice...")


app = FastAPI(
	title=PROJECT_NAME,
	version=PROJECT_VERSION,
	description="""
	Smart Lawyer Staff Registration Microservice

	Handles creating and managing staff profiles for a firm.
	""",
	lifespan=lifespan,
	docs_url="/docs",
	redoc_url="/redoc",
	openapi_url="/openapi.json",
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=ALLOWED_ORIGINS,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
	return JSONResponse(
		status_code=exc.status_code,
		content={
			"success": False,
			"message": exc.detail,
			"status_code": exc.status_code,
			"path": str(request.url),
		},
	)


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
	return JSONResponse(
		status_code=500,
		content={
			"success": False,
			"message": "Internal server error",
			"status_code": 500,
			"path": str(request.url),
			"detail": str(exc) if os.getenv("DEBUG") == "True" else None,
		},
	)


app.include_router(api_router, prefix=API_V1_STR)


@app.get("/health", response_model=ResponseBase, tags=["Health"])
async def health_check():
	return ResponseBase(
		success=True,
		message="Staff Registration Service is healthy",
		data={
			"service": PROJECT_NAME,
			"version": PROJECT_VERSION,
			"status": "operational",
		},
	)


@app.get("/", response_model=ResponseBase, tags=["Root"])
async def read_root():
	return ResponseBase(
		success=True,
		message="Welcome to Smart Lawyer Staff Registration API",
		data={
			"service": PROJECT_NAME,
			"version": PROJECT_VERSION,
			"docs": "/docs",
			"redoc": "/redoc",
			"api_prefix": API_V1_STR,
			"endpoints": {"staff": f"{API_V1_STR}/staff", "health": "/health"},
		},
	)


if __name__ == "__main__":
	import uvicorn

	print("🚀 Starting development server...")
	uvicorn.run(
		"main:app",
		host="localhost",
		port=8006,
		reload=True,
		log_level="info",
		reload_dirs=["app"],
		reload_includes=["*.py"],
	)
