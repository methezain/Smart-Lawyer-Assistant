from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, date
from enum import Enum


class CaseStatus(str, Enum):
    """Case status enumeration"""
    PENDING = "pending"
    ACTIVE = "active"
    CLOSED = "closed"
    NOT_APPROVED = "not approved"


class CaseType(str, Enum):
    """Common case types enumeration"""
    CIVIL = "Civil"
    CRIMINAL = "Criminal"
    FAMILY = "Family"
    COMMERCIAL = "Commercial"
    CORPORATE = "Corporate"
    PROPERTY = "Property"
    EMPLOYMENT = "Employment"
    IMMIGRATION = "Immigration"
    INTELLECTUAL = "Intellectual"
    TAX = "Tax"
    OTHER = "Other"



# Case Model
class CaseBase(SQLModel):
    title: str = Field(max_length=200, index=True)
    case_number: str = Field(max_length=50, unique=True, index=True)
    opponent: str = Field(max_length=200)
    type: str = Field(max_length=50, index=True)
    status: CaseStatus = Field(default=CaseStatus.PENDING, index=True)
    court_name: str = Field(max_length=200)
    filing_date: date
    next_hearing: Optional[date] = None
    description: Optional[str] = Field(default=None, max_length=5000)
    case_background: Optional[str] = Field(default=None, max_length=2000)
    legal_issues: Optional[str] = Field(default=None, max_length=2000)
    relevant_laws: Optional[str] = Field(default=None, max_length=2000)
    prayer_relief: Optional[str] = Field(default=None, max_length=2000)
    evidence_documents: Optional[str] = Field(default=None, max_length=1000)
    district_code: Optional[str] = Field(max_length=10, default=None)
    year_filed: int = Field(index=True)
    month_filed: int = Field(index=True)


class Case(CaseBase, table=True):
    __tablename__ = "cases"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Firm association - each case belongs to a firm
    firm_id: int = Field(index=True)
    
    # Store client and lawyer IDs and names
    client_id: int = Field(index=True)
    client_name: str = Field(max_length=100, index=True)
    assigned_lawyer_id: Optional[int] = Field(index=True, default=None)
    assigned_lawyer_name: Optional[str] = Field(max_length=100, index=True, default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class CaseCreate(CaseBase):
    client_id: int
    client_name: str
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None


class CaseRead(CaseBase):
    id: int
    firm_id: int
    client_id: int
    client_name: str
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class CaseUpdate(SQLModel):
    title: Optional[str] = None
    opponent: Optional[str] = None
    type: Optional[str] = None
    status: Optional[CaseStatus] = None
    court_name: Optional[str] = None
    filing_date: Optional[date] = None
    next_hearing: Optional[date] = None
    description: Optional[str] = None
    case_background: Optional[str] = None
    legal_issues: Optional[str] = None
    relevant_laws: Optional[str] = None
    prayer_relief: Optional[str] = None
    evidence_documents: Optional[str] = None
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None


