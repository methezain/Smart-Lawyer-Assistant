from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
import os
from dotenv import load_dotenv
from datetime import datetime, date

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./case_management.db")

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


def get_session():
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session


# Database initialization function
def init_db():
    """Initialize database with case management tables only"""
    create_db_and_tables()
    
    # Import models to ensure they're registered
    from app.models import Case
    from sqlmodel import select
    
    with Session(engine) as session:
        # Check if we already have data
        existing_cases = session.exec(select(Case)).first()
        if not existing_cases:
            print("Database initialized successfully (no sample data - using static data from frontend)")
        else:
            print("Database already contains data")
