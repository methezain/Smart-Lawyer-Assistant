from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class ClientCase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    client_id: int = Field(index=True)
    case_id: int = Field(index=True)
    staff_id: Optional[int] = Field(default=None, index=True)
    staff_name: Optional[str] = None
    firm_id: Optional[int] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
