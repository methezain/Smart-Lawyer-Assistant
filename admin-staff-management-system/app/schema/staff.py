from typing import List, Optional
from datetime import date
from pydantic import BaseModel, EmailStr, Field


class ResponseBase(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class StaffBase(BaseModel):
    name: str = Field(..., min_length=1)
    username: Optional[str] = None
    role: str
    specialization: Optional[str] = None
    experience: Optional[str] = None
    email: EmailStr
    phone: str
    join_date: date
    address: Optional[str] = None
    bio: Optional[str] = None
    education: List[str] = []
    bar_associations: List[str] = []
    avatar_url: Optional[str] = None


class StaffCreate(StaffBase):
    password: str = Field(..., min_length=6)


class StaffRead(StaffBase):
    id: int
    is_active: bool
    firm_id: Optional[int] = None
    password_length: Optional[int] = None

    class Config:
        from_attributes = True


class StaffUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    specialization: Optional[str] = None
    experience: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    join_date: Optional[date] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    education: Optional[List[str]] = None
    bar_associations: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)
