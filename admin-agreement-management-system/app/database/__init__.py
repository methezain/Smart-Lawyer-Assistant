from sqlmodel import SQLModel, create_engine
import os

DB_FILENAME = os.getenv(
    "AGREEMENTS_DB_FILE",
    os.path.abspath(os.path.join(os.getcwd(), "agreements_management.db")),
)
SQLITE_URL = f"sqlite:///{DB_FILENAME}"

engine = create_engine(SQLITE_URL, echo=False)


def create_db_and_tables():
    os.makedirs(os.path.dirname(DB_FILENAME), exist_ok=True)
    SQLModel.metadata.create_all(engine)
