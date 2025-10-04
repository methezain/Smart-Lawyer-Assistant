from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Build a stable absolute path for the default SQLite DB so it's created in this service folder
def _default_sqlite_url():
    # __file__ = <service>/app/database/__init__.py → service root is two levels up
    service_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), os.pardir, os.pardir)
    )
    db_path = os.path.abspath(os.path.join(service_dir, "permissions.db"))
    # SQLAlchemy on Windows prefers forward slashes in SQLite URLs
    db_uri_path = db_path.replace("\\", "/")
    return f"sqlite:///{db_uri_path}"

DATABASE_URL = os.getenv("DATABASE_URL", _default_sqlite_url())

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    # Import models to register metadata before create_all
    from app.models.permission import Permission  # noqa: F401
    Base.metadata.create_all(bind=engine)
    try:
        print(f"[permissions] Database initialized at: {engine.url}")
    except Exception:
        pass
