from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel

class DocumentBase(SQLModel):
    title: str
    doc_type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(SQLModel):
    title: Optional[str] = None
    doc_type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None

class DocumentRead(DocumentBase):
    id: int
    firm_id: int
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by: Optional[int] = None
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

class DocumentListResponse(SQLModel):
    documents: List[DocumentRead]
    pagination: PaginationInfo
