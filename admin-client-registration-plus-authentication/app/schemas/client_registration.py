from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, validator
from app.schemas.registration import StandardResponse, ResponseStatus, ErrorDetail

# Client Registration Schemas
class ClientRegistrationRequest(BaseModel):
    full_name: str
    username: str
    contact: str  # Can be email or phone
    password: str

    @validator('contact')
    def validate_contact(cls, v):
        # Check if it's a phone number (10-15 digits)
        if v.isdigit() and 10 <= len(v) <= 15:
            return v
        # Check if it's an email
        elif '@' in v and '.' in v:
            return v
        else:
            raise ValueError('Contact must be a valid email or phone number')

class ClientGoogleRegistrationRequest(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    google_id: str
    profile_image_url: Optional[str] = None

class ClientLoginRequest(BaseModel):
    username: str
    password: str

class ClientGoogleLoginRequest(BaseModel):
    google_id: str
    email: EmailStr

class ClientForgotPasswordRequest(BaseModel):
    contact: str  # Can be email, phone, or username

class ClientResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str

class ClientVerifyResetOTPRequest(BaseModel):
    reset_token: str
    otp_code: str

class ClientChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# Response Models
class ClientResponse(BaseModel):
    id: int
    full_name: str
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    profile_image_path: Optional[str] = None
    is_google_user: bool
    is_verified: bool
    created_at: datetime

class ClientLoginResponse(BaseModel):
    client: ClientResponse
    access_token: str
    token_type: str = "bearer"
