import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from app.models.database import get_session
from app.models.registration import User, Firm, Credentials, Pricing, Billing, Verification
from app.schemas.registration import (
    RegistrationResponse, RegistrationStatusResponse, StatusUpdateRequest,
    ErrorDetail, ResponseStatus, StandardResponse
)
from app.utils.security import get_password_hash, verify_password, create_access_token, decode_token
from app.utils.file_handler import save_upload_file
from app.utils.email import send_registration_confirmation, send_status_update_email

# Create router
router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_json_safely(json_str, default=None):
    """Parse JSON string safely, returning default if parsing fails."""
    if not json_str or not isinstance(json_str, str):
        return default if default is not None else []
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse JSON: {e}")
        return default if default is not None else []

# Helper function to create a standardized error response
def create_error_response(
    message: str,
    status_code: int = 400,
    error_code: str = "GENERAL_ERROR",
    field: Optional[str] = None,
    errors: Optional[List[ErrorDetail]] = None
) -> JSONResponse:
    """Create a standardized error response."""
    if errors is None:
        errors = [
            ErrorDetail(
                code=error_code,
                field=field,
                message=message
            )
        ]
    
    response = StandardResponse(
        status=ResponseStatus.ERROR,
        message=message,
        errors=errors,
        timestamp=datetime.utcnow(),
        data=None
    )
    
    return JSONResponse(
        status_code=status_code,
        content=json.loads(response.model_dump_json())
    )

@router.post(
    "/registration/admin/complete/",
    summary="Complete Admin Registration for a law firm",
    description="""
    This endpoint handles the complete Admin registration process for a law firm including:
    - User personal information
    - Firm details
    - Credentials (username/password)
    - Pricing information
    - Billing information
    - Verification documents
    
    All data should be submitted as a multipart/form-data. JSON fields (services, specialty, etc.)
    should be properly formatted JSON strings or arrays.
    
    Files can be uploaded for CNIC front/back, profile image, and verification documents.
    
    After successful registration, a confirmation email is sent to the provided email address.
    """,
    responses={
        200: {
            "description": "Registration successful",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "message": "Registration completed successfully. Your account is pending verification.",
                        "timestamp": "2023-08-15T12:34:56.789Z",
                        "data": {
                            "user_id": 1,
                            "firm_id": 1,
                            "verification_id": 1,
                            "email_sent": True,
                            "email_message": "A confirmation email has been sent to your email address."
                        }
                    }
                }
            }
        },
        400: {
            "description": "Bad Request - Invalid input or duplicate user",
            "content": {
                "application/json": {
                    "example": {
                        "status": "error",
                        "message": "User already exists",
                        "timestamp": "2023-08-15T12:34:56.789Z",
                        "errors": [
                            {
                                "code": "DUPLICATE_USER",
                                "field": "email",
                                "message": "User with this email already exists"
                            }
                        ]
                    }
                }
            }
        },
        500: {
            "description": "Server error",
            "content": {
                "application/json": {
                    "example": {
                        "status": "error",
                        "message": "An unexpected error occurred",
                        "timestamp": "2023-08-15T12:34:56.789Z",
                        "errors": [
                            {
                                "code": "SERVER_ERROR",
                                "message": "Error details"
                            }
                        ]
                    }
                }
            }
        }
    }
)
async def complete_registration(
    # User Info
    firstName: str = Form(..., description="User's first name"),
    middleName: Optional[str] = Form(None, description="User's middle name (optional)"),
    lastName: str = Form(..., description="User's last name"),
    cnicNumber: str = Form(..., description="CNIC number (must be unique)"),
    dateOfBirth: str = Form(..., description="Date of birth (format: YYYY-MM-DD)"),
    email: str = Form(..., description="Email address (must be unique)"),
    phone: str = Form(..., description="Phone number"),
    
    # Firm Info
    firmName: str = Form(..., description="Name of the law firm"),
    firmTitle: Optional[str] = Form(None, description="Title of the law firm (max 80 characters)"),
    firmType: str = Form(..., description="Type of firm (e.g., Solo Practice, Partnership)"),
    establishedYear: str = Form(..., description="Year when the firm was established"),
    services: str = Form("[]", description="JSON array of services offered by the firm"),
    specialty: str = Form("[]", description="JSON array of primary specialties"),
    secondarySpecialties: str = Form("[]", description="JSON array of secondary specialties"),
    description: str = Form(..., description="Detailed description of the firm"),
    advisory: str = Form("[]", description="JSON array of advisory team members"),
    officeHours: Optional[str] = Form(None, description="JSON array containing office hours ranges"),
    
    # Contact Info
    address: str = Form(..., description="Street address"),
    city: str = Form(..., description="City"),
    state: str = Form(..., description="State/Province"),
    zipCode: str = Form(..., description="Postal/ZIP code"),
    country: str = Form(..., description="Country"),
    website: Optional[str] = Form(None, description="Website URL (optional)"),
    
    # Credentials
    username: str = Form(..., description="Username for login (must be unique)"),
    password: str = Form(..., description="Password (will be securely hashed)"),
    
    # Pricing - Updated for either/or model
    caseFee: Optional[str] = Form(None, description="Fee charged per case"),
    caseCurrency: str = Form("PKR", description="Currency for case fee"),
    caseUnit: str = Form("case", description="Unit for case fee (e.g., case, matter)"),
    hourlyRate: Optional[str] = Form(None, description="Hourly rate charged"),
    hourlyCurrency: str = Form("PKR", description="Currency for hourly rate"),
    hourlyUnit: str = Form("hourly", description="Unit for hourly rate"),
    consultationFee: Optional[str] = Form(None, description="Fee for consultations"),
    consultationCurrency: str = Form("PKR", description="Currency for consultation fee"),
    consultationUnit: str = Form("hourly", description="Unit for consultation fee"),
    freeConsultation: bool = Form(False, description="Whether consultation is offered for free"),
    retainerFee: Optional[str] = Form(None, description="Retainer fee amount"),
    retainerCurrency: str = Form("PKR", description="Currency for retainer fee"),
    retainerUnit: str = Form("monthly", description="Period for retainer (monthly, annually)"),
    paymentMethods: str = Form("[]", description="JSON array of accepted payment methods"),
    
    # Billing Info
    bankName: str = Form(..., description="Name of the bank"),
    accountTitle: str = Form(..., description="Bank account title"),
    accountNumber: str = Form(..., description="Bank account number"),
    iban: str = Form(..., description="International Bank Account Number (IBAN)"),
    swiftCode: Optional[str] = Form(None, description="SWIFT/BIC code (optional)"),
    branchCode: Optional[str] = Form(None, description="Branch code (optional)"),
    taxId: Optional[str] = Form(None, description="Tax ID or NTN (optional)"),
    vatNumber: Optional[str] = Form(None, description="VAT registration number (optional)"),
    billingAddress: str = Form(..., description="Billing address"),
    billingCity: str = Form(..., description="Billing city"),
    billingState: str = Form(..., description="Billing state/province"),
    billingZipCode: str = Form(..., description="Billing postal/ZIP code"),
    billingCountry: str = Form(..., description="Billing country"),
    
    # Verification
    documentType: str = Form(..., description="Type of verification document (e.g., Bar License, Certificate)"),
    barCouncilNumber: str = Form(..., description="Bar Council registration number"),
    affiliation: str = Form(..., description="Bar Council affiliation"),
    termsAccepted: bool = Form(..., description="Whether terms and conditions are accepted (must be true)"),
    
    # Files
    cnicFront: Optional[UploadFile] = File(None, description="Front side of CNIC"),
    cnicBack: Optional[UploadFile] = File(None, description="Back side of CNIC"),
    profileImage: Optional[UploadFile] = File(None, description="Profile image"),
    bannerImage: Optional[UploadFile] = File(None, description="Firm banner image"),
    documentFile_front: Optional[UploadFile] = File(None, description="Front side of verification document"),
    documentFile_back: Optional[UploadFile] = File(None, description="Back side of verification document"),
    documentFile_certificate: Optional[UploadFile] = File(None, description="Certificate document"),
    
    session: Session = Depends(get_session)
):
    """
    Complete the registration process for a law firm.
    
    This endpoint handles the entire registration process, including:
    - User information
    - Firm information
    - Credentials
    - Pricing
    - Billing information
    - Verification
    - File uploads
    
    Returns a success response with the created user, firm, and verification IDs.
    """
    try:
        logger.info(f"Starting registration process for {firstName} {lastName} - {firmName}")
        
        # Validation errors collection
        validation_errors = []
        
        # Validate firm title length
        if firmTitle and len(firmTitle) > 80:
            validation_errors.append(
                ErrorDetail(
                    code="VALIDATION_ERROR",
                    field="firmTitle",
                    message="Firm title cannot exceed 80 characters"
                )
            )
        
        # Validate either/or pricing model
        if not caseFee and not hourlyRate:
            validation_errors.append(
                ErrorDetail(
                    code="VALIDATION_ERROR",
                    field="pricing",
                    message="Either case fee or hourly rate must be provided"
                )
            )
        elif caseFee and hourlyRate:
            validation_errors.append(
                ErrorDetail(
                    code="VALIDATION_ERROR",
                    field="pricing",
                    message="Please provide either case fee or hourly rate, not both"
                )
            )
        
        # Validate consultation fee logic
        if not freeConsultation and not consultationFee:
            validation_errors.append(
                ErrorDetail(
                    code="VALIDATION_ERROR",
                    field="consultationFee",
                    message="Consultation fee is required when not offering free consultation"
                )
            )
        elif freeConsultation and consultationFee:
            validation_errors.append(
                ErrorDetail(
                    code="VALIDATION_ERROR",
                    field="consultationFee",
                    message="Consultation fee should not be provided when offering free consultation"
                )
            )
        
        # Validate date of birth format (accept YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY)
        parsed_dob = None
        dob_formats = ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"]
        for fmt in dob_formats:
            if parsed_dob is not None:
                break
            try:
                parsed_dob = datetime.strptime(dateOfBirth, fmt)
            except ValueError:
                continue
        if not parsed_dob:
            validation_errors.append(
                ErrorDetail(
                    code="VALIDATION_ERROR",
                    field="dateOfBirth",
                    message="Date of birth must be in one of: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY"
                )
            )
        else:
            # Normalize to ISO YYYY-MM-DD for storage
            dateOfBirth = parsed_dob.strftime("%Y-%m-%d")
        
        # Return validation errors if any
        if validation_errors:
            logger.warning(
                "Registration validation failed: %s",
                [
                    {
                        "field": v.field,
                        "code": v.code,
                        "message": v.message,
                    }
                    for v in validation_errors
                ],
            )
            return create_error_response(
                message="Validation failed",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=validation_errors
            )
        
        # Check if user already exists with the same CNIC or email
        existing_user = session.exec(
            select(User).where((User.cnic_number == cnicNumber) | (User.email == email))
        ).first()
        
        if existing_user:
            if existing_user.cnic_number == cnicNumber:
                validation_errors.append(
                    ErrorDetail(
                        code="DUPLICATE_USER",
                        field="cnicNumber",
                        message="User with this CNIC number already exists"
                    )
                )
            if existing_user.email == email:
                validation_errors.append(
                    ErrorDetail(
                        code="DUPLICATE_USER",
                        field="email",
                        message="User with this email already exists"
                    )
                )
            
            return create_error_response(
                message="User already exists",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=validation_errors
            )
        
        # Check if username is taken
        existing_credentials = session.exec(
            select(Credentials).where(Credentials.username == username)
        ).first()
        
        if existing_credentials:
            return create_error_response(
                message="Username is already taken",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="DUPLICATE_USERNAME",
                field="username"
            )

        # Log key pricing / consultation inputs for debugging prior to DB writes
        logger.info(
            "Pricing debug -> caseFee=%s hourlyRate=%s freeConsultation=%s consultationFee=%s",
            caseFee,
            hourlyRate,
            freeConsultation,
            consultationFee,
        )
        
        # Process file uploads
        cnic_front_path = await save_upload_file(cnicFront, "cnic") if cnicFront else None
        cnic_back_path = await save_upload_file(cnicBack, "cnic") if cnicBack else None
        profile_image_path = await save_upload_file(profileImage, "profile_images") if profileImage else None
        banner_image_path = await save_upload_file(bannerImage, "banner_images") if bannerImage else None
        doc_front_path = await save_upload_file(documentFile_front, "documents") if documentFile_front else None
        doc_back_path = await save_upload_file(documentFile_back, "documents") if documentFile_back else None
        doc_cert_path = await save_upload_file(documentFile_certificate, "documents") if documentFile_certificate else None
        
        # Parse JSON strings safely
        services_list = parse_json_safely(services, [])
        specialty_list = parse_json_safely(specialty, [])
        secondary_specialties_list = parse_json_safely(secondarySpecialties, [])
        advisory_list = parse_json_safely(advisory, [])
        payment_methods_list = parse_json_safely(paymentMethods, [])
        office_hours_data = parse_json_safely(officeHours, [])
        
        # Log parsed JSON data for debugging
        logger.info(f"Parsed services: {services_list}")
        logger.info(f"Parsed specialty: {specialty_list}")
        logger.info(f"Parsed secondary specialties: {secondary_specialties_list}")
        logger.info(f"Parsed advisory: {advisory_list}")
        logger.info(f"Parsed payment methods: {payment_methods_list}")
        logger.info(f"Parsed office hours: {office_hours_data}")
        
        # Create credentials
        credentials = Credentials(
            username=username,
            password_hash=get_password_hash(password)
        )
        session.add(credentials)
        session.flush()  # Get the ID
        
        # Create pricing
        pricing = Pricing(
            case_fee=caseFee,
            case_currency=caseCurrency,
            case_unit=caseUnit,
            hourly_rate=hourlyRate,
            hourly_currency=hourlyCurrency,
            hourly_unit=hourlyUnit,
            consultation_fee=consultationFee if not freeConsultation else None,
            consultation_currency=consultationCurrency,
            consultation_unit=consultationUnit,
            free_consultation=freeConsultation,
            retainer_fee=retainerFee,
            retainer_currency=retainerCurrency,
            retainer_unit=retainerUnit,
            payment_methods=json.dumps(payment_methods_list)
        )
        session.add(pricing)
        session.flush()  # Get the ID
        
        # Create billing
        billing = Billing(
            bank_name=bankName,
            account_title=accountTitle,
            account_number=accountNumber,
            iban=iban,
            swift_code=swiftCode,
            branch_code=branchCode,
            tax_id=taxId,
            vat_number=vatNumber,
            billing_address=billingAddress,
            billing_city=billingCity,
            billing_state=billingState,
            billing_zip_code=billingZipCode,
            billing_country=billingCountry
        )
        session.add(billing)
        session.flush()  # Get the ID
        
        # Create verification
        verification = Verification(
            document_type=documentType,
            document_file_front_path=doc_front_path,
            document_file_back_path=doc_back_path,
            document_file_certificate_path=doc_cert_path,
            bar_council_number=barCouncilNumber,
            affiliation=affiliation,
            terms_accepted=termsAccepted,
            is_verified=False,  # Default to not verified
            is_rejected=False,  # Default to not rejected
            verification_date=None  # Will be set when verified
        )
        session.add(verification)
        session.flush()  # Get the ID
        
        # Create firm with new fields
        firm = Firm(
            firm_name=firmName,
            firm_title=firmTitle,
            firm_type=firmType,
            established_year=establishedYear,
            services=json.dumps(services_list),
            specialty=json.dumps(specialty_list),
            secondary_specialties=json.dumps(secondary_specialties_list),
            advisory=json.dumps(advisory_list) if advisory_list else None,
            banner_image_path=banner_image_path,
            office_hours=json.dumps(office_hours_data) if office_hours_data else None,
            description=description,
            address=address,
            city=city,
            state=state,
            zip_code=zipCode,
            country=country,
            website=website,
            pricing_id=pricing.id,
            billing_id=billing.id
        )
        session.add(firm)
        session.flush()  # Get the ID
        
        # Create user
        user = User(
            first_name=firstName,
            middle_name=middleName,
            last_name=lastName,
            cnic_number=cnicNumber,
            date_of_birth=dateOfBirth,
            cnic_front_path=cnic_front_path,
            cnic_back_path=cnic_back_path,
            profile_image_path=profile_image_path,
            email=email,
            phone=phone,
            firm_id=firm.id,
            credentials_id=credentials.id,
            verification_id=verification.id
        )
        session.add(user)
        
        # Commit all changes
        session.commit()
        
        # Send confirmation email
        user_data = {
            "email": email,
            "first_name": firstName,
            "last_name": lastName,
            "firm_name": firmName
        }
        
        email_sent = send_registration_confirmation(user_data)
        
        email_message = ""
        if email_sent:
            logger.info(f"Confirmation email sent successfully to {email}")
            email_message = "A confirmation email has been sent to your email address."
        else:
            logger.warning(f"Failed to send confirmation email to {email}")
            email_message = "Your registration is successful, but we couldn't send a confirmation email. Please check your email address."
        
        # Return success response
        response = RegistrationResponse(
            status=ResponseStatus.SUCCESS,
            message=f"Registration completed successfully. Your account is pending verification. {email_message}",
            timestamp=datetime.utcnow(),
            data={
                "user_id": user.id,
                "firm_id": firm.id,
                "verification_id": verification.id,
                "email_sent": email_sent,
                "email_message": email_message
            }
        )
        
        # Use model_dump_json to handle datetime serialization
        return JSONResponse(content=json.loads(response.model_dump_json()))
        
    except HTTPException as e:
        logger.error(f"HTTP error during registration: {e.detail}")
        return create_error_response(
            message=e.detail,
            status_code=e.status_code,
            error_code="HTTP_EXCEPTION"
        )
    except Exception as e:
        logger.error(f"Error during registration: {str(e)}")
        session.rollback()
        
        # Determine if it's a JSON parsing error
        if "Expecting value" in str(e):
            return create_error_response(
                message="Invalid JSON format in one or more fields",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="JSON_PARSE_ERROR"
            )
        # Database related error
        elif "SQL" in str(e) or "IntegrityError" in str(e):
            return create_error_response(
                message="Database error occurred",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                error_code="DATABASE_ERROR"
            )
        # File upload error
        elif "File" in str(e) or "IO" in str(e):
            return create_error_response(
                message="Error uploading files",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                error_code="FILE_UPLOAD_ERROR"
            )
        # General server error
        else:
            return create_error_response(
                message=f"An unexpected error occurred: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                error_code="SERVER_ERROR"
            )


@router.patch(
    "/registration/update-status/{email}",
    summary="Update registration status by email (Admin Only)",
    description="""
    Admin endpoint to update registration status from pending to approved or rejected.
    Sends notification email to the user upon status change.
    """,
    responses={
        200: {
            "description": "Status updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "message": "Registration status updated to approved successfully",
                        "timestamp": "2023-08-15T12:34:56.789Z",
                        "data": {
                            "email": "user@example.com",
                            "previous_status": "pending",
                            "new_status": "approved",
                            "email_sent": True,
                            "user_name": "John Doe",
                            "firm_name": "ABC Law Firm"
                        }
                    }
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {
                        "status": "error",
                        "message": "User not found",
                        "timestamp": "2023-08-15T12:34:56.789Z",
                        "errors": [
                            {
                                "code": "USER_NOT_FOUND",
                                "field": "email",
                                "message": "No user found with the provided email"
                            }
                        ]
                    }
                }
            }
        },
        400: {
            "description": "Invalid status or request",
            "content": {
                "application/json": {
                    "example": {
                        "status": "error",
                        "message": "Invalid status value",
                        "timestamp": "2023-08-15T12:34:56.789Z",
                        "errors": [
                            {
                                "code": "INVALID_STATUS",
                                "field": "status",
                                "message": "Status must be either 'approved' or 'rejected'"
                            }
                        ]
                    }
                }
            }
        },
        422: {
            "description": "Validation Error",
            "content": {
                "application/json": {
                    "example": {
                        "status": "error",
                        "message": "Validation failed",
                        "timestamp": "2023-08-15T12:34:56.789Z",
                        "errors": [
                            {
                                "code": "VALIDATION_ERROR",
                                "field": "status",
                                "message": "Status must be either 'approved' or 'rejected'"
                            }
                        ]
                    }
                }
            }
        }
    }
)
async def update_registration_status(
    email: str,
    request_data: Dict[str, Any],
    session: Session = Depends(get_session)
):
    """
    Update registration status from pending to approved or rejected using email.
    
    Args:
        email: The email of the user whose status needs to be updated
        request_data: Dictionary containing any key with status value ('approved' or 'rejected')
        session: Database session
    
    Returns:
        JSON response with operation result and user details
    """
    try:
        # Extract status value from any key in the request data
        new_status = None
        for key, value in request_data.items():
            if isinstance(value, str) and value.lower() in ["approved", "rejected"]:
                new_status = value.lower()
                break
        
        # If no valid status found, check if there's a 'status' key specifically
        if not new_status and 'status' in request_data:
            status_value = request_data['status']
            if isinstance(status_value, str) and status_value.lower() in ["approved", "rejected"]:
                new_status = status_value.lower()
        
        # Validate that we found a valid status
        if not new_status:
            return create_error_response(
                message="Invalid status value",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="INVALID_STATUS",
                field="status",
                errors=[
                    ErrorDetail(
                        code="INVALID_STATUS",
                        field="status",
                        message="Request must contain a status value of either 'approved' or 'rejected'"
                    )
                ]
            )
        
        # Find user by email
        user = session.exec(select(User).where(User.email == email)).first()
        
        if not user:
            return create_error_response(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="USER_NOT_FOUND",
                field="email",
                errors=[
                    ErrorDetail(
                        code="USER_NOT_FOUND",
                        field="email",
                        message="No user found with the provided email"
                    )
                ]
            )
        
        # Get verification record
        verification = user.verification
        
        if not verification:
            return create_error_response(
                message="Verification record not found",
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="VERIFICATION_NOT_FOUND",
                errors=[
                    ErrorDetail(
                        code="VERIFICATION_NOT_FOUND",
                        field="verification",
                        message="No verification record found for this user"
                    )
                ]
            )
        
        # Store previous status for response
        previous_status = "pending"
        if verification.is_verified:
            previous_status = "approved"
        elif verification.is_rejected:
            previous_status = "rejected"
        
        # Update verification status
        if new_status == "approved":
            verification.is_verified = True
            verification.is_rejected = False
            verification.verification_date = datetime.utcnow()
        elif new_status == "rejected":
            verification.is_verified = False
            verification.is_rejected = True
            verification.verification_date = None
        
        # Save changes to database
        session.add(verification)
        session.commit()
        session.refresh(verification)
        
        # Get firm information for email
        firm = user.firm
        firm_name = firm.firm_name if firm else "Your Firm"
        
        # Prepare user data for email
        user_data = {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "firm_name": firm_name,
            "status": new_status
        }
        
        # Send status update email
        email_sent = False
        try:
            email_sent = send_status_update_email(user_data)
            if email_sent:
                logger.info(f"Status update email sent successfully to {user.email}")
            else:
                logger.warning(f"Failed to send status update email to {user.email}")
        except Exception as email_error:
            logger.error(f"Error sending status update email: {str(email_error)}")
            email_sent = False
        
        # Create success response
        response_data = {
            "email": email,
            "user_id": user.id,
            "previous_status": previous_status,
            "new_status": new_status,
            "email_sent": email_sent,
            "user_name": f"{user.first_name} {user.last_name}",
            "firm_name": firm_name,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        success_message = f"Registration status updated to {new_status} successfully"
        if email_sent:
            success_message += f". Notification email sent to {user.email}"
        else:
            success_message += f". Status updated but notification email could not be sent"
        
        response = StandardResponse(
            status=ResponseStatus.SUCCESS,
            message=success_message,
            timestamp=datetime.utcnow(),
            data=response_data,
            errors=None
        )
        
        return JSONResponse(content=json.loads(response.model_dump_json()))
        
    except Exception as e:
        logger.error(f"Error updating registration status: {str(e)}")
        return create_error_response(
            message=f"An error occurred while updating registration status: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="SERVER_ERROR"
        )
