from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
from datetime import date

class ResponseBase(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class JudgmentOCRResponse(ResponseBase):
    data: Dict[str, Any]

class JudgmentCreate(BaseModel):
    case_id: int
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None
    status: Optional[str] = None
    status_details: Optional[str] = None
    court: str
    judge_name: str
    judgment_date: date
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    remarks: Optional[str] = None
    pdf_path: Optional[str] = None

class JudgmentRead(BaseModel):
    id: int
    case_id: int
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None
    status: str
    status_details: Optional[str] = None
    court: str
    judge_name: str
    judgment_date: date
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    remarks: Optional[str] = None
    pdf_path: Optional[str] = None

class JudgmentResponse(ResponseBase):
    data: Optional[JudgmentRead] = None

class JudgmentListResponse(ResponseBase):
    data: Dict[str, Any]

class JudgmentUpdate(BaseModel):
    # All fields optional for PATCH-like behavior
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    assigned_lawyer_id: Optional[int] = None
    assigned_lawyer_name: Optional[str] = None
    status: Optional[str] = None
    status_details: Optional[str] = None
    court: Optional[str] = None
    judge_name: Optional[str] = None
    judgment_date: Optional[date] = None
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    remarks: Optional[str] = None
