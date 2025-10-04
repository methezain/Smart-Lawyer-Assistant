from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class CaseStatusEnum(str, Enum):
    """Case status enumeration for API"""
    PENDING = "pending"
    ACTIVE = "active"
    CLOSED = "closed"
    NOT_APPROVED = "not approved"


class CaseSortEnum(str, Enum):
    """Case sorting options for API"""
    LATEST = "latest"
    OLDEST = "oldest"
    UPCOMING = "upcoming"
    CASE_NUMBER = "case_number"
    TITLE = "title"
    CLIENT = "client"
    STATUS = "status"


# Base Response Schema
class ResponseBase(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None


# Case Schemas
class CaseBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    opponent: str = Field(..., min_length=2, max_length=200)
    type: str = Field(..., min_length=2, max_length=50)
    status: CaseStatusEnum = CaseStatusEnum.PENDING
    court_name: str = Field(..., min_length=5, max_length=200)
    filing_date: date
    next_hearing: Optional[date] = None
    description: Optional[str] = Field(None, max_length=5000)
    case_background: Optional[str] = Field(None, max_length=2000)
    legal_issues: Optional[str] = Field(None, max_length=2000)
    relevant_laws: Optional[str] = Field(None, max_length=2000)
    prayer_relief: Optional[str] = Field(None, max_length=2000)
    evidence_documents: Optional[str] = Field(None, max_length=1000)
    district_code: Optional[str] = Field(None, max_length=10)

    @validator('next_hearing')
    def validate_next_hearing(cls, v, values):
        if v and 'filing_date' in values and v < values['filing_date']:
            raise ValueError('Next hearing date cannot be before filing date')
        return v


class CaseCreate(CaseBase):
    client_id: int = Field(..., gt=0)
    client_name: str = Field(..., min_length=2, max_length=100)
    assigned_lawyer_id: Optional[int] = Field(None, gt=0)
    assigned_lawyer_name: Optional[str] = Field(None, min_length=2, max_length=100)
    # Aliases for backward/forward compatibility with frontend expecting staff_* fields
    staff_id: Optional[int] = Field(None, gt=0)
    staff_name: Optional[str] = Field(None, min_length=2, max_length=100)

    @validator('assigned_lawyer_id')
    def validate_assigned_lawyer_id(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Assigned lawyer ID must be a positive integer')
        return v


class CaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    opponent: Optional[str] = Field(None, min_length=2, max_length=200)
    type: Optional[str] = Field(None, min_length=2, max_length=50)
    status: Optional[CaseStatusEnum] = None
    court_name: Optional[str] = Field(None, min_length=5, max_length=200)
    filing_date: Optional[date] = None
    next_hearing: Optional[date] = None
    description: Optional[str] = Field(None, max_length=5000)
    case_background: Optional[str] = Field(None, max_length=2000)
    legal_issues: Optional[str] = Field(None, max_length=2000)
    relevant_laws: Optional[str] = Field(None, max_length=2000)
    prayer_relief: Optional[str] = Field(None, max_length=2000)
    evidence_documents: Optional[str] = Field(None, max_length=1000)
    assigned_lawyer_id: Optional[int] = Field(None, gt=0)
    assigned_lawyer_name: Optional[str] = Field(None, min_length=2, max_length=100)

    @validator('next_hearing')
    def validate_next_hearing(cls, v, values):
        if v and 'filing_date' in values and values['filing_date'] and v < values['filing_date']:
            raise ValueError('Next hearing date cannot be before filing date')
        return v


class CaseResponse(CaseBase):
    id: int
    case_number: str
    client_id: int
    client_name: str
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None
    # Aliases to expose staff_* consistently to consumers
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    year_filed: int
    month_filed: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Pagination Schemas
class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=15, ge=1, le=100)


class PaginationInfo(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class CaseListResponse(BaseModel):
    cases: List[CaseResponse]
    pagination: PaginationInfo


# Filter and Search Schemas
class CaseFilters(BaseModel):
    search: Optional[str] = Field(None, max_length=200)
    status: Optional[CaseStatusEnum] = None
    type: Optional[str] = Field(None, max_length=50)
    assigned_lawyer_id: Optional[int] = Field(None, gt=0)
    client_id: Optional[int] = Field(None, gt=0)
    filing_date_from: Optional[date] = None
    filing_date_to: Optional[date] = None
    next_hearing_from: Optional[date] = None
    next_hearing_to: Optional[date] = None
    sort_by: CaseSortEnum = CaseSortEnum.LATEST

    @validator('filing_date_to')
    def validate_filing_date_range(cls, v, values):
        if v and 'filing_date_from' in values and values['filing_date_from'] and v < values['filing_date_from']:
            raise ValueError('Filing date "to" cannot be before "from" date')
        return v

    @validator('next_hearing_to')
    def validate_hearing_date_range(cls, v, values):
        if v and 'next_hearing_from' in values and values['next_hearing_from'] and v < values['next_hearing_from']:
            raise ValueError('Next hearing "to" date cannot be before "from" date')
        return v


# Analytics Schemas
class CaseStatistics(BaseModel):
    total_cases: int
    active_cases: int
    pending_cases: int
    closed_cases: int
    upcoming_hearings: int
    # Monthly changes
    monthly_changes: Dict[str, int] = {}  # e.g., {"total_cases": 5, "active_cases": 3}
    weekly_hearings: int = 0
    quarterly_clients: int = 0


# Error Schemas
class ErrorDetail(BaseModel):
    field: str
    message: str
    code: Optional[str] = None


class ValidationErrorResponse(BaseModel):
    success: bool = False
    message: str = "Validation error"
    errors: List[ErrorDetail]


class NotFoundResponse(BaseModel):
    success: bool = False
    message: str = "Resource not found"
    errors: Optional[List[str]] = None
