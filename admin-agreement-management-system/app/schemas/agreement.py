from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel

class AgreementBase(SQLModel):
    title: str
    case_type: Optional[str] = None
    status: Optional[str] = None

    client: Optional[str] = None
    client_cnic: Optional[str] = None
    client_address: Optional[str] = None
    law_firm: Optional[str] = None

    amount: Optional[float] = None
    currency: Optional[str] = None

    contract_content: Optional[str] = None

    filed_date: Optional[datetime] = None
    expected_file_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    contract_duration: Optional[int] = None
    termination_date: Optional[datetime] = None

    terms: Optional[List[str]] = None
    documents: Optional[List[dict]] = None  # [{name, url}]

class AgreementCreate(AgreementBase):
    pass

class AgreementUpdate(SQLModel):
    title: Optional[str] = None
    case_type: Optional[str] = None
    status: Optional[str] = None

    client: Optional[str] = None
    client_cnic: Optional[str] = None
    client_address: Optional[str] = None
    law_firm: Optional[str] = None

    amount: Optional[float] = None
    currency: Optional[str] = None

    contract_content: Optional[str] = None

    filed_date: Optional[datetime] = None
    expected_file_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    contract_duration: Optional[int] = None
    termination_date: Optional[datetime] = None

    terms: Optional[List[str]] = None
    documents: Optional[List[dict]] = None

class AgreementRead(AgreementBase):
    id: int
    firm_id: int
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

class PaginationInfo(SQLModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool

class AgreementListResponse(SQLModel):
    agreements: List[AgreementRead]
    pagination: PaginationInfo
