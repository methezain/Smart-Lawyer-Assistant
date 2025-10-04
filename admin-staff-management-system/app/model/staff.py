from typing import Optional, List
from sqlmodel import SQLModel, Field, Column, JSON
from datetime import date


class Staff(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Basic info
    name: str
    username: Optional[str] = Field(default=None, index=True, unique=True)
    role: str
    specialization: Optional[str] = None
    experience: Optional[str] = None
    join_date: date

    # Ownership
    firm_id: Optional[int] = Field(default=None, index=True)

    # Contact
    email: str = Field(index=True, unique=True)
    phone: str
    address: Optional[str] = None

    # Profile
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

    # Arrays
    education: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    bar_associations: List[str] = Field(default_factory=list, sa_column=Column(JSON))

    # Credentials (encrypted)
    password_encrypted: Optional[str] = None
    password_length: Optional[int] = None

    # System
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
