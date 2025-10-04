from sqlmodel import SQLModel, create_engine, Session
import os

DB_PATH = os.getenv("CLIENTS_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "clients.db"))
DB_PATH = os.path.abspath(DB_PATH)
DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    # Import only the remaining models
    from app.models import Client, ClientType
    SQLModel.metadata.create_all(engine)

    # Lightweight migration for schema changes
    with engine.connect() as conn:
        try:
            rows = conn.exec_driver_sql("PRAGMA table_info(client)").fetchall()
            existing_cols = {row[1] for row in rows}  # row[1] is column name

            # New columns
            if "case_id" not in existing_cols:
                conn.exec_driver_sql("ALTER TABLE client ADD COLUMN case_id INTEGER")
            if "assigned_lawyer_id" not in existing_cols:
                conn.exec_driver_sql("ALTER TABLE client ADD COLUMN assigned_lawyer_id INTEGER")
            if "assigned_lawyer_name" not in existing_cols:
                conn.exec_driver_sql(
                    "ALTER TABLE client ADD COLUMN assigned_lawyer_name VARCHAR(255)"
                )
            if "pendingCases" not in existing_cols:
                conn.exec_driver_sql("ALTER TABLE client ADD COLUMN pendingCases INTEGER DEFAULT 0")
            if "closedCases" not in existing_cols:
                conn.exec_driver_sql("ALTER TABLE client ADD COLUMN closedCases INTEGER DEFAULT 0")
            if "case_status" not in existing_cols:
                conn.exec_driver_sql("ALTER TABLE client ADD COLUMN case_status VARCHAR(32)")

            # Backfill from legacy columns if present and new columns are NULL
            legacy_cols = existing_cols
            if {"last_case_id", "case_id"}.issubset(legacy_cols):
                conn.exec_driver_sql(
                    "UPDATE client SET case_id = COALESCE(case_id, last_case_id)"
                )
            if {"staff_id", "assigned_lawyer_id"}.issubset(legacy_cols):
                conn.exec_driver_sql(
                    "UPDATE client SET assigned_lawyer_id = COALESCE(assigned_lawyer_id, staff_id)"
                )
            if {"staff_name", "assigned_lawyer_name"}.issubset(legacy_cols):
                conn.exec_driver_sql(
                    "UPDATE client SET assigned_lawyer_name = COALESCE(assigned_lawyer_name, staff_name)"
                )

            # Drop obsolete clientcase table if it exists
            try:
                conn.exec_driver_sql("DROP TABLE IF EXISTS clientcase")
            except Exception:
                pass

        except Exception:
            # Best-effort migration; ignore if PRAGMA not available or other benign issues
            pass

def get_session():
    with Session(engine) as session:
        yield session
