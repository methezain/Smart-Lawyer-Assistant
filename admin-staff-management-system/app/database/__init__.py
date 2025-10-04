from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./staff.db")

engine = create_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    # Lightweight migration: ensure firm_id exists on staff table (SQLite)
    with engine.connect() as conn:
        try:
            cols = conn.execute(text("PRAGMA table_info(staff)")).fetchall()
            col_names = {c[1] for c in cols}
            if "firm_id" not in col_names:
                conn.execute(text("ALTER TABLE staff ADD COLUMN firm_id INTEGER"))
            # New credential fields (demo-only reversible storage)
            if "password_encrypted" not in col_names:
                conn.execute(
                    text("ALTER TABLE staff ADD COLUMN password_encrypted TEXT")
                )
            if "password_length" not in col_names:
                conn.execute(
                    text("ALTER TABLE staff ADD COLUMN password_length INTEGER")
                )
            if "username" not in col_names:
                conn.execute(text("ALTER TABLE staff ADD COLUMN username TEXT"))
        except Exception as e:
            # Best-effort; log to console but don't crash service
            print(f"[DB] Migration check failed or not needed: {e}")


def get_session():
    with Session(engine) as session:
        yield session


def init_db():
    create_db_and_tables()
