from typing import Optional
from datetime import date, datetime
from enum import Enum
from sqlmodel import SQLModel, Field

class ClientType(str, Enum):
    INDIVIDUAL = "Individual"
    BUSINESS = "Business"

class Client(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    firm_id: Optional[int] = Field(default=1, index=True)

    # Basic
    name: str
    email: str
    phone: str
    address: Optional[str] = None
    type: ClientType = Field(default=ClientType.INDIVIDUAL)

    # Status
    onlineStatus: Optional[str] = Field(default="offline")

    # Individual fields
    cnic: Optional[str] = None
    occupation: Optional[str] = None
    nationality: Optional[str] = None
    religion: Optional[str] = None
    maritalStatus: Optional[str] = None
    gender: Optional[str] = None

    # Business fields
    ntn: Optional[str] = None
    industry: Optional[str] = None
    contactPerson: Optional[str] = None

    # Meta
    notes: Optional[str] = None
    joinDate: date = Field(default_factory=lambda: date.today())
    totalCases: int = Field(default=0)
    activeCases: int = Field(default=0)
    pastCases: int = Field(default=0)
    # New granular counters by status
    pendingCases: int = Field(default=0)
    closedCases: int = Field(default=0)

    # Cross-service linkage (optional)
    case_id: Optional[int] = Field(default=None, index=True)
    case_status: Optional[str] = None  # status of the linked/last case
    assigned_lawyer_id: Optional[int] = Field(default=None, index=True)
    assigned_lawyer_name: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
