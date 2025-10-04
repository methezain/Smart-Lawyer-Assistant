from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime, date, time
from enum import Enum


class HearingStatus(str, Enum):
    """Hearing status enumeration"""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    POSTPONED = "postponed"
    ADJOURNED = "adjourned"
    CANCELLED = "cancelled"


class HearingType(str, Enum):
    """Hearing type enumeration"""
    INITIAL = "Initial Hearing"
    ARGUMENTS = "Arguments"
    EVIDENCE = "Evidence"
    FINAL = "Final Hearing"
    BAIL = "Bail Hearing"
    INTERIM = "Interim Application"
    CASE_MANAGEMENT = "Case Management"
    SETTLEMENT = "Settlement Conference"
    MEDIATION = "Mediation"
    OTHER = "Other"


# Hearing Model
class HearingBase(SQLModel):
    case_id: int = Field(index=True, description="Associated case ID")
    case_number: str = Field(max_length=50, index=True, description="Case number for quick reference")
    case_title: str = Field(max_length=200, index=True, description="Case title for display")
    # Cross-linking
    client_id: Optional[int] = Field(default=None, index=True, description="Client ID from Client service")
    client_name: Optional[str] = Field(default=None, max_length=100, description="Client name snapshot")
    
    # Hearing details
    hearing_date: date = Field(index=True, description="Date of the hearing")
    hearing_time: time = Field(description="Time of the hearing")
    duration: str = Field(max_length=50, default="1 hour", description="Expected duration")
    hearing_type: str = Field(max_length=50, index=True, description="Type of hearing")
    status: HearingStatus = Field(default=HearingStatus.SCHEDULED, index=True)
    
    # Court details
    court_name: str = Field(max_length=200, description="Name of the court")
    judge_name: str = Field(max_length=100, description="Name of the presiding judge")
    court_location: str = Field(max_length=300, description="Physical location/address of court")
    
    # Additional information
    notes: Optional[str] = Field(default=None, max_length=2000, description="Additional notes about the hearing")
    required_documents: Optional[str] = Field(default=None, max_length=1000, description="Required documents for the hearing")
    
    # Lawyer/advocate information
    assigned_lawyer_id: Optional[int] = Field(default=None, index=True, description="ID of assigned lawyer")
    assigned_lawyer_name: Optional[str] = Field(default=None, max_length=100, description="Name of assigned lawyer")


class Hearing(HearingBase, table=True):
    __tablename__ = "hearings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Firm association - each hearing belongs to a firm
    firm_id: int = Field(index=True, description="Firm ID for data isolation")
    
    # Audit fields
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    created_by: int = Field(description="User ID who created the hearing")
    updated_by: Optional[int] = Field(default=None, description="User ID who last updated the hearing")


class HearingCreate(HearingBase):
    pass


class HearingRead(HearingBase):
    id: int
    firm_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: int
    updated_by: Optional[int] = None


class HearingUpdate(SQLModel):
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    hearing_date: Optional[date] = None
    hearing_time: Optional[time] = None
    duration: Optional[str] = None
    hearing_type: Optional[str] = None
    status: Optional[HearingStatus] = None
    court_name: Optional[str] = None
    judge_name: Optional[str] = None
    court_location: Optional[str] = None
    notes: Optional[str] = None
    required_documents: Optional[str] = None
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None


# Hearing Attachment Model
class HearingAttachment(SQLModel, table=True):
    __tablename__ = "hearing_attachments"

    id: Optional[int] = Field(default=None, primary_key=True)
    hearing_id: int = Field(index=True, description="Associated hearing ID")
    firm_id: int = Field(index=True, description="Firm ID for data isolation")
    original_filename: str = Field(max_length=255, description="Original uploaded filename")
    stored_filename: str = Field(max_length=255, description="Stored filename on disk")
    file_path: str = Field(max_length=500, description="Relative file path on disk")
    file_type: str = Field(max_length=100, description="MIME type or file extension")
    file_size: int = Field(description="File size in bytes")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    uploaded_by: int = Field(description="User ID who uploaded the file")
