from typing import Optional, List, Any, Dict, Union
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
import json
from pydantic import model_serializer

# Request Schemas
class RegistrationRequest(BaseModel):
    # User Information
    firstName: str
    middleName: Optional[str] = None
    lastName: str
    cnicNumber: str
    dateOfBirth: str
    email: EmailStr
    phone: str
    
    # Firm Information
    firmName: str
    firmTitle: Optional[str] = None  # New field for firm title (max 80 chars)
    firmType: str
    establishedYear: str
    services: List[str]
    specialty: List[str]
    secondarySpecialties: List[str]
    description: str
    advisory: Optional[List[str]] = []  # New field for advisory list
    bannerImage: Optional[str] = None  # New field for banner image
    
    # Contact Information
    address: str
    city: str
    state: str
    zipCode: str
    country: str
    website: Optional[str] = None
    officeHours: Optional[List[Dict[str, Any]]] = []  # New field for office hours ranges
    
    # Credentials
    username: str
    password: str
    
    # Pricing - Updated validation logic
    caseFee: Optional[str] = None
    caseCurrency: str = "PKR"
    caseUnit: str = "case"
    hourlyRate: Optional[str] = None
    hourlyCurrency: str = "PKR"
    hourlyUnit: str = "hourly"
    consultationFee: Optional[str] = None
    consultationCurrency: str = "PKR"
    consultationUnit: str = "hourly"
    freeConsultation: bool = False  # New field for free consultation
    retainerFee: Optional[str] = None
    retainerCurrency: str = "PKR"
    retainerUnit: str = "monthly"
    paymentMethods: Optional[List[str]] = []
    
    # Billing Information
    bankName: str
    accountTitle: str
    accountNumber: str
    iban: str
    swiftCode: Optional[str] = None
    branchCode: Optional[str] = None
    taxId: Optional[str] = None
    vatNumber: Optional[str] = None
    billingAddress: str
    billingCity: str
    billingState: str
    billingZipCode: str
    billingCountry: str
    
    # Verification
    documentType: str
    barCouncilNumber: str
    affiliation: str
    termsAccepted: bool = False
    
    @validator('dateOfBirth')
    def validate_date_of_birth(cls, v):
        if not v:
            raise ValueError('Date of birth is required')
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError('Date of birth must be in YYYY-MM-DD format')
        return v
    
    @validator('termsAccepted')
    def terms_must_be_accepted(cls, v):
        if not v:
            raise ValueError('Terms and conditions must be accepted')
        return v
    
    @validator('firmTitle')
    def firm_title_length(cls, v):
        if v and len(v) > 80:
            raise ValueError('Firm title cannot exceed 80 characters')
        return v
    
    @validator('caseFee', 'hourlyRate', always=True)
    def validate_pricing_either_or(cls, v, values):
        case_fee = values.get('caseFee')
        hourly_rate = values.get('hourlyRate')
        
        # Check if values are meaningful (not None or empty string)
        has_case_fee = case_fee is not None and case_fee != '' and str(case_fee).strip() != ''
        has_hourly_rate = hourly_rate is not None and hourly_rate != '' and str(hourly_rate).strip() != ''
        
        # Either case fee OR hourly rate must be provided, but not both
        if not has_case_fee and not has_hourly_rate:
            raise ValueError('Either case fee or hourly rate must be provided')
        if has_case_fee and has_hourly_rate:
            raise ValueError('Please provide either case fee or hourly rate, not both')
        return v
    
    @validator('consultationFee')
    def validate_consultation_fee(cls, v, values):
        free_consultation = values.get('freeConsultation', False)
        has_consultation_fee = v is not None and v != '' and str(v).strip() != ''
        
        if not free_consultation and not has_consultation_fee:
            raise ValueError('Consultation fee is required when not offering free consultation')
        if free_consultation and has_consultation_fee:
            raise ValueError('Consultation fee should not be provided when offering free consultation')
        return v


class StatusUpdateRequest(BaseModel):
    """Schema for status update request"""
    status: str
    
    @validator('status')
    def validate_status(cls, v):
        if v.lower() not in ['approved', 'rejected']:
            raise ValueError('Status must be either "approved" or "rejected"')
        return v.lower()


class RegistrationStatusRequest(BaseModel):
    cnic_number: str


# Standardized API Response Structure
class ResponseStatus:
    """Standardized status codes for API responses"""
    SUCCESS = "success"
    ERROR = "error"
    PENDING = "pending"
    COMPLETED = "completed"


class ErrorDetail(BaseModel):
    """Detailed error information"""
    code: str  # Error code (e.g., "VALIDATION_ERROR", "DB_ERROR")
    field: Optional[str] = None  # Field that caused the error (for validation errors)
    message: str  # Human-readable error message


class StandardResponse(BaseModel):
    """Base structure for all API responses"""
    status: str  # "success", "error", "pending", "completed"
    message: str  # User-friendly message
    timestamp: datetime = datetime.utcnow()
    errors: Optional[List[ErrorDetail]] = None  # List of errors (if any)
    data: Optional[Dict[str, Any]] = None  # Response data (if any)
    
    def model_dump_json(self, **kwargs):
        """Override to handle datetime serialization"""
        return json.dumps(self.model_dump(**kwargs), 
                          default=lambda o: o.isoformat() if isinstance(o, datetime) else None)
    
    def dict(self, **kwargs):
        """Override dict method to handle datetime serialization"""
        data = super().dict(**kwargs)
        # Convert datetime objects to ISO format strings
        if "timestamp" in data and isinstance(data["timestamp"], datetime):
            data["timestamp"] = data["timestamp"].isoformat()
        return data


# Response Schemas
class RegistrationResponse(StandardResponse):
    """Response for registration endpoint"""
    data: Optional[Dict[str, Any]] = {
        "user_id": None,
        "firm_id": None,
        "verification_id": None
    }


class RegistrationStatusResponse(StandardResponse):
    """Response for registration status endpoint"""
    data: Dict[str, Any] = {
        "user_info": False,
        "firm_info": False,
        "contact_info": False,
        "credentials": False,
        "pricing": False,
        "billing_info": False,
        "verification": False,
        "registration_date": None
    } 