from sqlmodel import SQLModel, create_engine
import os

DATABASE_URL = os.getenv("DOCUMENTS_DATABASE_URL", "sqlite:///./documents.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    # Add new columns if missing (SQLite)
    try:
        with engine.connect() as conn:
            rows = conn.exec_driver_sql("PRAGMA table_info(documents)").fetchall()
            cols = {row[1] for row in rows}
            if "client_id" not in cols:
                conn.exec_driver_sql("ALTER TABLE documents ADD COLUMN client_id INTEGER")
            # New fields to mirror hearings/judgments linking
            if "client_name" not in cols:
                conn.exec_driver_sql("ALTER TABLE documents ADD COLUMN client_name VARCHAR(100)")
            if "assigned_lawyer_id" not in cols:
                conn.exec_driver_sql("ALTER TABLE documents ADD COLUMN assigned_lawyer_id INTEGER")
            if "assigned_lawyer_name" not in cols:
                conn.exec_driver_sql("ALTER TABLE documents ADD COLUMN assigned_lawyer_name VARCHAR(100)")
    except Exception:
        pass

# Back-compat alias
def init_db() -> None:
    create_db_and_tables()
