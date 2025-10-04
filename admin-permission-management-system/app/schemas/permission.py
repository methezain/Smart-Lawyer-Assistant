from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PermissionBase(BaseModel):
    admin_id: int = Field(..., gt=0)
    assigned_lawyer_id: int = Field(..., gt=0)
    module: str = Field(..., pattern=r"^(cases|judgments|hearings|documents|clients)$")
    can_add: bool = False
    can_edit: bool = False
    can_delete: bool = False

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    can_add: Optional[bool] = None
    can_edit: Optional[bool] = None
    can_delete: Optional[bool] = None

class PermissionOut(PermissionBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BulkApplyRequest(BaseModel):
    admin_id: int
    assigned_lawyer_ids: List[int]
    permissions: dict  # { moduleId: { add, edit, delete } }

class ResponseBase(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
