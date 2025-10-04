from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import classification


def create_app() -> FastAPI:
    app = FastAPI(title="Staff Case Classification API", version="1.0.0")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost",
            "http://127.0.0.1",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(classification.router, prefix="/api/classification", tags=["classification"])

    @app.on_event("startup")
    def on_startup():
        init_db()

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8011)
