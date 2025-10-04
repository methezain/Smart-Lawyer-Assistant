import os
from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy import text
from pathlib import Path
# Ensure models are imported so SQLModel.metadata includes all tables
from app.models import registration as _registration  # noqa: F401
from app.models import login_session as _login_session  # noqa: F401

# Load environment variables
load_dotenv()

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartlawyer.db")

# Create database directory if it doesn't exist
db_file = Path(DATABASE_URL.replace("sqlite:///", ""))
db_file.parent.mkdir(parents=True, exist_ok=True)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    echo=True,  # Set to False in production
    connect_args={"check_same_thread": False}  # Only needed for SQLite
)

# Function to create all tables
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    _apply_migrations()


def _apply_migrations():
    """Lightweight, idempotent migrations for SQLite-only deployments.
    Adds missing columns used by newer app versions.
    """
    try:
        with engine.connect() as conn:
            # Check columns in login_session table; add duration_minutes if missing
            try:
                res = conn.execute(text("PRAGMA table_info('loginsession')"))
                cols = [row[1] for row in res.fetchall()]  # row[1] = name
                if 'duration_minutes' not in cols:
                    conn.execute(text("ALTER TABLE loginsession ADD COLUMN duration_minutes INTEGER"))
            except Exception:
                # Table might not exist yet or different dialect; ignore
                pass
            conn.commit()
    except Exception:
        # Migration is best-effort; avoid crashing startup
        pass

# Session dependency
def get_session():
    with Session(engine) as session:
        yield session 