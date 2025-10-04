from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field


class LoginSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # We intentionally avoid a foreign key since staff lives in another service
    staff_id: int = Field(index=True)
    firm_id: int = Field(index=True)

    login_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    logout_at: Optional[datetime] = Field(default=None, index=True)

    # Persisted total duration for this session in minutes (set on logout).
    # Kept nullable for existing/open sessions; computed server-side when logout_at is set.
    duration_minutes: Optional[int] = Field(default=None, description="Total session duration in minutes")

    ip: Optional[str] = None
    user_agent: Optional[str] = None
