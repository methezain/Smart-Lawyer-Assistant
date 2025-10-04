from __future__ import annotations

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class ClassificationBase(BaseModel):
    filename: str
    category: str
    pdf_text: Optional[str] = None
    assigned_lawyer_id: int = Field(..., alias="assigned_lawyer_id")
    firm_id: int
    assigned_lawyer_name: Optional[str] = None
    firm_name: Optional[str] = None


class ClassificationCreate(BaseModel):
    assigned_lawyer_id: int
    firm_id: int
    assigned_lawyer_name: Optional[str] = None
    firm_name: Optional[str] = None


class ClassificationOut(ClassificationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class ClassificationList(BaseModel):
    items: List[ClassificationOut]
    total: int
