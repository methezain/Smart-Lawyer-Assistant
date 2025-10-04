from typing import Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from datetime import date
from app.models import ClientType

class ResponseBase(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class Pagination(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    type: ClientType = ClientType.INDIVIDUAL
    onlineStatus: Optional[str] = "offline"

    # Individual
    cnic: Optional[str] = None
    occupation: Optional[str] = None
    nationality: Optional[str] = None
    religion: Optional[str] = None
    maritalStatus: Optional[str] = None
    gender: Optional[str] = None

    # Business
    ntn: Optional[str] = None
    industry: Optional[str] = None
    contactPerson: Optional[str] = None

    notes: Optional[str] = None
    # Optional link fields (updated)
    case_id: Optional[int] = None
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    type: Optional[ClientType] = None
    onlineStatus: Optional[str] = None

    cnic: Optional[str] = None
    occupation: Optional[str] = None
    nationality: Optional[str] = None
    religion: Optional[str] = None
    maritalStatus: Optional[str] = None
    gender: Optional[str] = None

    ntn: Optional[str] = None
    industry: Optional[str] = None
    contactPerson: Optional[str] = None

    notes: Optional[str] = None
    # Optional link fields (updated)
    case_id: Optional[int] = None
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None

class ClientRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    address: Optional[str]
    type: ClientType
    onlineStatus: Optional[str]
    cnic: Optional[str]
    occupation: Optional[str]
    nationality: Optional[str]
    religion: Optional[str]
    maritalStatus: Optional[str]
    gender: Optional[str]
    ntn: Optional[str]
    industry: Optional[str]
    contactPerson: Optional[str]
    notes: Optional[str]
    joinDate: date
    totalCases: int
    activeCases: int
    pastCases: int
    pendingCases: int | None = 0
    closedCases: int | None = 0
    # Linkage
    case_id: Optional[int]
    case_status: Optional[str] = None
    assigned_lawyer_id: Optional[int]
    assigned_lawyer_name: Optional[str]

class ClientResponse(ResponseBase):
    data: ClientRead | None

class ClientListResponse(ResponseBase):
    data: Dict[str, Any]
