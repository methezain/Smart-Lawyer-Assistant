"""Application entrypoint for Staff AI Docs Drafting service.

Exposes rental/lease agreement drafting endpoints.

Run with:
	uvicorn app.main:app --reload --port 8015
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routers.rental_agreement import router as rental_agreement_router

load_dotenv()  # Load GROQ API key and other env vars

app = FastAPI(title="Staff AI Docs Drafting", version="1.0.0")

allowed_origins = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:3000",
	"http://127.0.0.1:3000",
]

app.add_middleware(
	CORSMiddleware,
	allow_origins=allowed_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


# Include routers (versioned API prefix)
app.include_router(rental_agreement_router, prefix="/api/v1")


@app.get("/health", tags=["system"])
def health_check():
	return {"status": "ok"}


# No __main__ guard needed for deployment; retained for local convenience.
if __name__ == "__main__":  # pragma: no cover
	import uvicorn

	uvicorn.run("app.main:app", host="0.0.0.0", port=8015, reload=True)
