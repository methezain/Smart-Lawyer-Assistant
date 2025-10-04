from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
import os
from dotenv import load_dotenv
from datetime import datetime, date

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hearings_management.db")

# Create engine with connection pooling for SQLite
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def create_db_and_tables():
    """Create database tables"""
    SQLModel.metadata.create_all(engine)
    # Lightweight migration for new columns
    try:
        with engine.connect() as conn:
            rows = conn.exec_driver_sql("PRAGMA table_info(hearings)").fetchall()
            cols = {row[1] for row in rows}
            if "client_id" not in cols:
                conn.exec_driver_sql("ALTER TABLE hearings ADD COLUMN client_id INTEGER")
            if "client_name" not in cols:
                conn.exec_driver_sql("ALTER TABLE hearings ADD COLUMN client_name VARCHAR(100)")
    except Exception:
        pass


def get_session():
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session


# Database initialization function
def init_db():
    """Initialize database with hearings management tables"""
    create_db_and_tables()
    
    # Import models to ensure they're registered
    from app.models import Hearing, HearingAttachment
    from sqlmodel import select
    
    with Session(engine) as session:
        # Check if we already have data
        existing_hearings = session.exec(select(Hearing)).first()
        if not existing_hearings:
            print("Database initialized successfully (no sample data)")
        else:
            print("Database already contains data")
