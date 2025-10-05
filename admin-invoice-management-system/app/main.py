from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import invoices
from .database import init_db

app = FastAPI(title="Admin Invoice Management System", version="1.0.0")
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(invoices.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Invoice Management Service",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8008,
        reload=False,
        log_level="info"
    )
