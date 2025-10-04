from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
import os
from sqlalchemy import text

DATABASE_URL = os.getenv("JUDGMENTS_DB_URL", "sqlite:///./judgments_management.db")

engine = create_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    # Lightweight migration for new columns (SQLite)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE judgments ADD COLUMN case_number VARCHAR"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE judgments ADD COLUMN case_title VARCHAR"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE judgments ADD COLUMN client_id INTEGER"))
        except Exception:
            pass
      
            pass
        # New columns for richer cross-links (idempotent)
        try:
            conn.execute(text("ALTER TABLE judgments ADD COLUMN client_name VARCHAR(100)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE judgments ADD COLUMN assigned_lawyer_id INTEGER"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE judgments ADD COLUMN assigned_lawyer_name VARCHAR(100)"))
        except Exception:
            pass


def get_session():
    with Session(engine) as session:
        yield session
