from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

class Client(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    username: str = Field(unique=True, index=True)
    email: Optional[str] = Field(default=None, unique=True, index=True)
    phone: Optional[str] = Field(default=None, unique=True, index=True)
    profile_image_path: Optional[str] = None
    google_id: Optional[str] = Field(default=None, unique=True, index=True)  # For Google OAuth
    is_google_user: bool = Field(default=False)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    credentials_id: Optional[int] = Field(default=None, foreign_key="clientcredentials.id")
    credentials: Optional["ClientCredentials"] = Relationship(back_populates="client")

class ClientCredentials(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: Optional[str] = None  # Optional for Google users
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    client: Optional["Client"] = Relationship(back_populates="credentials")

class ClientPasswordReset(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True)
    email: Optional[str] = Field(default=None, index=True)
    phone: Optional[str] = Field(default=None, index=True)
    reset_token: str = Field(unique=True, index=True)
    otp_code: str
    expires_at: datetime
    is_used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
