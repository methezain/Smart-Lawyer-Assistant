from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship, JSON, Column
import json

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    cnic_number: str = Field(unique=True, index=True)
    date_of_birth: str
    cnic_front_path: Optional[str] = None
    cnic_back_path: Optional[str] = None
    profile_image_path: Optional[str] = None
    email: str = Field(unique=True, index=True)
    phone: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    firm_id: Optional[int] = Field(default=None, foreign_key="firm.id")
    firm: Optional["Firm"] = Relationship(back_populates="user")
    
    credentials_id: Optional[int] = Field(default=None, foreign_key="credentials.id")
    credentials: Optional["Credentials"] = Relationship(back_populates="user")
    
    verification_id: Optional[int] = Field(default=None, foreign_key="verification.id")
    verification: Optional["Verification"] = Relationship(back_populates="user")


class Firm(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    firm_name: str
    firm_title: Optional[str] = None  # New field for firm title (max 80 chars)
    firm_type: str
    established_year: str
    services: str = Field(sa_column=Column(JSON))  # Stored as JSON
    specialty: str = Field(sa_column=Column(JSON))  # Stored as JSON
    secondary_specialties: str = Field(sa_column=Column(JSON))  # Stored as JSON
    description: str
    advisory: Optional[str] = Field(default=None, sa_column=Column(JSON))  # New field for advisory list
    banner_image_path: Optional[str] = None  # New field for banner image
    office_hours: Optional[str] = Field(default=None, sa_column=Column(JSON))  # Updated from operating_hours
    
    # Contact information
    address: str
    city: str
    state: str
    zip_code: str
    country: str
    website: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional["User"] = Relationship(back_populates="firm")
    
    pricing_id: Optional[int] = Field(default=None, foreign_key="pricing.id")
    pricing: Optional["Pricing"] = Relationship(back_populates="firm")
    
    billing_id: Optional[int] = Field(default=None, foreign_key="billing.id")
    billing: Optional["Billing"] = Relationship(back_populates="firm")


class Credentials(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional["User"] = Relationship(back_populates="credentials")


class Pricing(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    case_fee: Optional[str] = None
    case_currency: str = "PKR"
    case_unit: str = "case"
    
    hourly_rate: Optional[str] = None
    hourly_currency: str = "PKR"
    hourly_unit: str = "hourly"
    
    consultation_fee: Optional[str] = None
    consultation_currency: str = "PKR"
    consultation_unit: str = "hourly"
    free_consultation: bool = False  # New field for free consultation
    
    retainer_fee: Optional[str] = None
    retainer_currency: str = "PKR"
    retainer_unit: str = "monthly"
    
    payment_methods: str = Field(sa_column=Column(JSON))  # Stored as JSON
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    firm: Optional["Firm"] = Relationship(back_populates="pricing")


class Billing(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    bank_name: str
    account_title: str
    account_number: str
    iban: str
    swift_code: Optional[str] = None
    branch_code: Optional[str] = None
    tax_id: Optional[str] = None
    vat_number: Optional[str] = None
    
    billing_address: str
    billing_city: str
    billing_state: str
    billing_zip_code: str
    billing_country: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    firm: Optional["Firm"] = Relationship(back_populates="billing")


class Verification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    document_type: str
    document_file_front_path: Optional[str] = None
    document_file_back_path: Optional[str] = None
    document_file_certificate_path: Optional[str] = None
    bar_council_number: str
    affiliation: str
    terms_accepted: bool = False
    is_verified: bool = False
    is_rejected: bool = False
    verification_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional["User"] = Relationship(back_populates="verification") 


class PasswordReset(SQLModel, table=True):
    """Model for storing password reset tokens and OTPs."""
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    otp_code: str
    token: str = Field(unique=True, index=True)
    expires_at: datetime
    is_used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Optional: link to user if needed
    user_id: Optional[int] = Field(default=None, foreign_key="user.id") 