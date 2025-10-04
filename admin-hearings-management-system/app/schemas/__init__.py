from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import date, time, datetime
from enum import Enum

# Re-export models for convenience
from app.models import (
    HearingCreate, HearingRead, HearingUpdate,
    HearingStatus, HearingType, Hearing,
    HearingAttachment
)


class ResponseBase(BaseModel):
    """Base response model"""
    success: bool = Field(description="Whether the request was successful")
    message: str = Field(description="Response message")
    data: Optional[Any] = Field(default=None, description="Response data")


class ValidationErrorResponse(BaseModel):
    """Validation error response"""
    success: bool = False
    message: str = "Validation error"
    errors: List[Dict[str, Any]] = Field(description="List of validation errors")


class NotFoundResponse(BaseModel):
    """Not found error response"""
    success: bool = False
    message: str = "Resource not found"


class HearingResponse(ResponseBase):
    """Single hearing response"""
    data: Optional[HearingRead] = None


class HearingListResponse(ResponseBase):
    """Hearing list response with pagination"""
    data: Dict[str, Any] = Field(description="Response data with hearings and pagination")


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(15, ge=1, le=100, description="Number of items per page")
    total_pages: int = Field(description="Total number of pages")
    total_items: int = Field(description="Total number of items")
    has_next: bool = Field(description="Whether there is a next page")
    has_prev: bool = Field(description="Whether there is a previous page")


class HearingFilters(BaseModel):
    """Hearing filtering options"""
    search: Optional[str] = None
    status: Optional[HearingStatus] = None
    hearing_type: Optional[str] = None
    case_id: Optional[int] = None
    assigned_lawyer_id: Optional[int] = None
    hearing_date_from: Optional[date] = None
    hearing_date_to: Optional[date] = None
    court_name: Optional[str] = None
    judge_name: Optional[str] = None


class HearingSortEnum(str, Enum):
    """Hearing sorting options"""
    LATEST = "latest"
    OLDEST = "oldest"
    DATE_ASC = "date_asc"
    DATE_DESC = "date_desc"
    COURT = "court"
    STATUS = "status"
    TYPE = "type"


class HearingStatistics(BaseModel):
    """Hearing statistics model"""
    total_hearings: int
    scheduled_hearings: int
    completed_hearings: int
    postponed_hearings: int
    cancelled_hearings: int
    upcoming_this_week: int
    upcoming_this_month: int
    by_type: Dict[str, int]
    by_court: Dict[str, int]
    by_month: Dict[str, int]


class UpcomingHearing(BaseModel):
    """Upcoming hearing summary"""
    id: int
    case_number: str
    case_title: str
    hearing_date: date
    hearing_time: time
    court_name: str
    hearing_type: str
    days_until: int


class HearingCalendarEvent(BaseModel):
    """Calendar event for hearing"""
    id: int
    title: str
    date: date
    time: time
    court: str
    type: str
    status: str
    case_number: str


class HearingAttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    hearing_id: int
    firm_id: int
    original_filename: str
    stored_filename: str
    file_path: str
    file_type: str
    file_size: int
    uploaded_at: datetime
    uploaded_by: int


class HearingAttachmentListResponse(ResponseBase):
    data: List[HearingAttachmentRead]


class AttachmentUploadResponse(ResponseBase):
    data: HearingAttachmentRead


class AttachmentCountResponse(ResponseBase):
    data: int
