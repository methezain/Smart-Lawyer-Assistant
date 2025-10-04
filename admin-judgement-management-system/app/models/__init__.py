from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, date

class Judgment(SQLModel, table=True):
    __tablename__ = "judgments"
    id: Optional[int] = Field(default=None, primary_key=True)
    firm_id: int = Field(index=True)
    case_id: int = Field(index=True)
    # Cross-linking
    client_id: Optional[int] = Field(default=None, index=True)
    client_name: Optional[str] = Field(default=None, max_length=100)
    # Assigned lawyer details (explicit fields to mirror hearings)
    assigned_lawyer_id: Optional[int] = Field(default=None, index=True)
    assigned_lawyer_name: Optional[str] = Field(default=None, max_length=100)
    # Denormalized fields for display (captured at creation/update time)
    case_number: Optional[str] = Field(default=None, index=True)
    case_title: Optional[str] = None
    status: str = Field(default="Favorable")
    status_details: Optional[str] = None
    court: str
    judge_name: str
    judgment_date: date
    summary: Optional[str] = None
    key_points: Optional[str] = None  # newline-separated
    remarks: Optional[str] = None
    pdf_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: int
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None
