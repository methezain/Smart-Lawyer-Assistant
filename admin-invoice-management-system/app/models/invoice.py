from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Invoice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    firm_id: int = Field(index=True)
    agreement_id: Optional[int] = Field(default=None, index=True)
    invoice_no: str = Field(index=True)
    client_name: str
    contract_title: str
    issued_date: str
    due_date: str
    status: str = Field(default="Unpaid", index=True)
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    total_amount: float = 0.0
    amount_paid: float = 0.0
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class InvoiceItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(index=True)
    description: str
    amount: float


class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(index=True)
    amount: float
    method: Optional[str] = None
    reference: Optional[str] = None
    paid_date: str
