import os
from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine
from pathlib import Path

# Load environment variables
load_dotenv()

# Get client database URL from environment or use default
CLIENT_DATABASE_URL = os.getenv("CLIENT_DATABASE_URL", "sqlite:///./client.db")

# Create database directory if it doesn't exist
db_file = Path(CLIENT_DATABASE_URL.replace("sqlite:///", ""))
db_file.parent.mkdir(parents=True, exist_ok=True)

# Create SQLAlchemy engine for client database
client_engine = create_engine(
    CLIENT_DATABASE_URL,
    echo=True,  # Set to False in production
    connect_args={"check_same_thread": False}  # Only needed for SQLite
)

# Function to create all client tables
def create_client_db_and_tables():
    from app.models.client_registration import Client, ClientCredentials, ClientPasswordReset
    SQLModel.metadata.create_all(client_engine)

# Client session dependency
def get_client_session():
    with Session(client_engine) as session:
        yield session
