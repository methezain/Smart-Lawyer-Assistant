from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class LoginSessionCreate(BaseModel):
    staff_id: int
    login_at: Optional[datetime] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None


class LoginSessionEnd(BaseModel):
    logout_at: Optional[datetime] = None


class LoginSessionRead(BaseModel):
    id: int
    staff_id: int
    firm_id: int
    login_at: datetime
    logout_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True
