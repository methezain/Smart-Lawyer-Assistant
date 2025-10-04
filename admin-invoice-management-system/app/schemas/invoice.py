from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class InvoiceItemCreate(BaseModel):
    description: str
    amount: float


class InvoiceItemRead(InvoiceItemCreate):
    id: int


class PaymentCreate(BaseModel):
    amount: float
    method: Optional[str] = None
    reference: Optional[str] = None
    paid_date: str


class PaymentRead(PaymentCreate):
    id: int


class InvoiceBase(BaseModel):
    agreement_id: Optional[int] = None
    client_name: str
    contract_title: str
    issued_date: str
    due_date: str
    status: str = Field(default="Unpaid")
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    invoice_no: str | None = None
    items: List[InvoiceItemCreate]


class InvoiceUpdate(BaseModel):
    invoice_no: Optional[str] = None
    client_name: Optional[str] = None
    contract_title: Optional[str] = None
    issued_date: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceRead(InvoiceBase):
    id: int
    firm_id: int
    invoice_no: str
    total_amount: float
    amount_paid: float
    items: List[InvoiceItemRead] = []
    payments: List[PaymentRead] = []
    created_by: int | None = None
    updated_by: int | None = None
    created_at: datetime
    updated_at: datetime


class PaginationInfo(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class InvoiceListResponse(BaseModel):
    invoices: List[InvoiceRead]
    pagination: PaginationInfo


class AgreementLedger(BaseModel):
    agreement_id: int
    invoice_count: int
    total_billed: float
    total_paid: float
    outstanding: float
