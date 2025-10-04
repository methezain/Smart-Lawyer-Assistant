from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: Optional[int] = Field(default=None, primary_key=True)
    firm_id: int = Field(index=True)
    case_id: Optional[int] = Field(default=None, index=True)
    case_number: Optional[str] = Field(default=None, index=True)
    case_title: Optional[str] = Field(default=None)
    # Cross-linking
    client_id: Optional[int] = Field(default=None, index=True)
    client_name: Optional[str] = Field(default=None, max_length=100)
    assigned_lawyer_id: Optional[int] = Field(default=None, index=True)
    assigned_lawyer_name: Optional[str] = Field(default=None, max_length=100)

    title: str = Field(index=True)
    doc_type: Optional[str] = Field(default=None, index=True)
    status: Optional[str] = Field(default="uploaded", index=True)
    description: Optional[str] = None
    tags: Optional[str] = Field(default=None, description="Comma separated tags")

    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None

    uploaded_by: Optional[int] = Field(default=None, index=True)
    updated_by: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})
