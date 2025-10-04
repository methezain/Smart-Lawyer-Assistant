import os
from sqlmodel import SQLModel, create_engine
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("INVOICES_DB_URL", "sqlite:///invoices_management.db")
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

def init_db():
    from ..models import Invoice, InvoiceItem, Payment
    SQLModel.metadata.create_all(engine)
