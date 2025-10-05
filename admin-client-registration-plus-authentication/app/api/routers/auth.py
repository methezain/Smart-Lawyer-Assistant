import json
import os
import re
from fastapi import APIRouter, Depends, HTTPException, status, Form, Request
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
import httpx
import secrets
import random

# Import both database sessions
from app.models.database import get_session
from app.models.client_database import get_client_session

# Import admin models
from app.models.registration import User, Firm, Credentials, Pricing, Billing, Verification, PasswordReset

# Import client models
from app.models.client_registration import Client, ClientCredentials, ClientPasswordReset

# Import schemas
from app.schemas.registration import (
    RegistrationResponse, RegistrationStatusResponse, 
    ErrorDetail, ResponseStatus, StandardResponse
)
from app.schemas.client_registration import (
    ClientRegistrationRequest, ClientGoogleRegistrationRequest,
    ClientLoginRequest, ClientGoogleLoginRequest,
    ClientForgotPasswordRequest, ClientResetPasswordRequest,
    ClientVerifyResetOTPRequest, ClientChangePasswordRequest,
    ClientResponse, ClientLoginResponse
)

from app.utils.security import get_password_hash, verify_password, create_access_token, decode_token
from app.models.login_session import LoginSession
from datetime import timezone
from app.utils.email import send_reset_password_email, send_client_registration_confirmation

# Create router
router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper functions
def is_phone_number(contact: str) -> bool:
    """Check if contact is a phone number (10-15 digits)."""
    return bool(re.match(r'^\d{10,15}$', contact))

def is_email(contact: str) -> bool:
    """Check if contact is an email."""
    return bool(re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', contact))

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

# Unified Login Endpoint
@router.post(
    "/auth/login/",
    summary="Unified login for both admin and client users",
    description="""
    Authenticate users (admin or client) using their credentials.
    Returns a JWT token for accessing protected endpoints.
    
    For admin users:
    - Uses username/password authentication
    - Only allows login for users with approved registration status
    - Uses registration.db database
    
    For client users:
    - Uses username/password authentication
    - Auto-approved after registration
    - Uses client.db database
    """,
    responses={
        200: {"description": "Login successful"},
        401: {"description": "Invalid credentials"},
        403: {"description": "Registration not approved (admin only)"},
        400: {"description": "Invalid user type"}
    }
)
async def unified_login(
    username: str = Form(..., description="Username for login"),
    password: str = Form(..., description="Password for login"),
    user_type: str = Form(..., description="User type: 'admin' or 'client' or 'staff'"),
    firm_id: Optional[int] = Form(None, description="Firm ID (required for staff)"),
    request: Request = None,
    admin_session: Session = Depends(get_session),
    client_session: Session = Depends(get_client_session)
):
    """Unified authentication for both admin and client users."""
    try:
        if user_type not in ["admin", "client", "staff"]:
            return create_error_response(
                message="Invalid user type. Must be 'admin', 'client' or 'staff'",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="INVALID_USER_TYPE"
            )

        logger.info(f"{user_type.capitalize()} login attempt for username: {username}")

        if user_type == "admin":
            return await _admin_login(username, password, admin_session)
        elif user_type == "client":
            return await _client_login(username, password, client_session)
        else:
            if not firm_id:
                return create_error_response(
                    message="firm_id is required for staff login",
                    status_code=status.HTTP_400_BAD_REQUEST,
                    error_code="MISSING_FIRM_ID",
                    field="firm_id",
                )
            return await _staff_login(username, password, firm_id, request, admin_session)

    except Exception as e:
        logger.error(f"Error during {user_type} login: {str(e)}")
        return create_error_response(
            message=f"Login failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="SERVER_ERROR"
        )

async def _admin_login(username: str, password: str, session: Session):
    """Handle admin login logic."""
    # Find credentials by username
    credentials = session.exec(
        select(Credentials).where(Credentials.username == username)
    ).first()

    if not credentials:
        return create_error_response(
            message="Invalid credentials",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS"
        )

    # Verify password
    if not verify_password(password, credentials.password_hash):
        return create_error_response(
            message="Invalid credentials",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS"
        )

    # Find user associated with these credentials
    user = session.exec(
        select(User).where(User.credentials_id == credentials.id)
    ).first()

    if not user:
        return create_error_response(
            message="User not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="USER_NOT_FOUND"
        )

    # Get firm details
    firm = session.exec(
        select(Firm).where(Firm.id == user.firm_id)
    ).first()

    # Get verification status
    verification = session.exec(
        select(Verification).where(Verification.id == user.verification_id)
    ).first()

    # Determine verification status
    verification_status = "pending"  # default
    is_verified = False

    if verification:
        is_verified = verification.is_verified
        if verification.is_verified:
            verification_status = "approved"
        elif verification.is_rejected:
            verification_status = "rejected"
        else:
            verification_status = "pending"

    # Check if user is approved for login
    if not verification or not verification.is_verified:
        if verification and verification.is_rejected:
            return create_error_response(
                message="Your registration has been rejected. Please contact support for assistance.",
                status_code=status.HTTP_403_FORBIDDEN,
                error_code="REGISTRATION_REJECTED",
                errors=[
                    ErrorDetail(
                        code="REGISTRATION_REJECTED",
                        field="verification_status",
                        message="Your registration status is rejected"
                    )
                ]
            )
        else:
            return create_error_response(
                message="Your registration is pending approval. Please wait for admin verification.",
                status_code=status.HTTP_403_FORBIDDEN,
                error_code="REGISTRATION_PENDING",
                errors=[
                    ErrorDetail(
                        code="REGISTRATION_PENDING",
                        field="verification_status",
                        message="Your registration status is pending approval"
                    )
                ]
            )

    # Create JWT token (only for approved users)
    token_data = {
        "sub": str(user.id),
        "username": credentials.username,
        "firm_id": user.firm_id,
        "user_type": "admin"
    }

    access_token = create_access_token(data=token_data)

    # Return success response
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Login successful",
        timestamp=datetime.utcnow(),
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "firm_id": user.firm_id,
            "username": credentials.username,
            "firm_name": firm.firm_name if firm else None,
            "is_verified": is_verified,
            "verification_status": verification_status,
            "user_type": "admin",
            "user_details": {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": user.phone,
                "profile_image_path": user.profile_image_path
            }
        },
        errors=None
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

async def _client_login(username: str, password: str, session: Session):
    """Handle client login logic."""
    # Find client by username
    client = session.exec(
        select(Client).where(Client.username == username)
    ).first()

    if not client:
        return create_error_response(
            message="Invalid username or password",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS"
        )

    # Check if it's a Google user
    if client.is_google_user:
        return create_error_response(
            message="Please login with Google",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="GOOGLE_USER"
        )

    # Verify password
    if not client.credentials or not verify_password(password, client.credentials.password_hash):
        return create_error_response(
            message="Invalid username or password",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS"
        )

    # Create access token
    access_token = create_access_token(data={
        "sub": str(client.id),
        "username": client.username,
        "user_type": "client"
    })

    # Prepare response
    client_response = ClientResponse(
        id=client.id,
        full_name=client.full_name,
        username=client.username,
        email=client.email,
        phone=client.phone,
        profile_image_path=client.profile_image_path,
        is_google_user=client.is_google_user,
        is_verified=client.is_verified,
        created_at=client.created_at
    )

    login_response = ClientLoginResponse(
        client=client_response,
        access_token=access_token
    )

    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Login successful",
        timestamp=datetime.utcnow(),
        data=login_response.model_dump()
    )

    return JSONResponse(
        status_code=200,
        content=json.loads(response.model_dump_json())
    )

# Public endpoint to list firms (id and name) for staff login firm selection
@router.get(
    "/auth/firms/",
    summary="List firms for selection",
    description="Returns a list of firm IDs and names",
)
async def list_firms(admin_session: Session = Depends(get_session)):
    try:
        firms = admin_session.exec(select(Firm)).all()
        items = []
        for f in firms:
            # Try to find the admin user and their username for this firm
            admin_user = admin_session.exec(select(User).where(User.firm_id == f.id)).first()
            admin_username = None
            if admin_user and admin_user.credentials_id:
                creds = admin_session.exec(
                    select(Credentials).where(Credentials.id == admin_user.credentials_id)
                ).first()
                if creds:
                    admin_username = creds.username

            items.append(
                {
                    "id": f.id,
                    "firm_name": f.firm_name,
                    "city": f.city,
                    "country": f.country,
                    "username": admin_username,
                }
            )
        response = StandardResponse(
            status=ResponseStatus.SUCCESS,
            message="Firms fetched",
            timestamp=datetime.utcnow(),
            data={"firms": items},
        )
        return JSONResponse(content=json.loads(response.model_dump_json()))
    except Exception as e:
        logger.error(f"Failed to fetch firms: {e}")
        return create_error_response(
            message="Failed to fetch firms",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="SERVER_ERROR",
        )

async def _staff_login(username: str, password: str, firm_id: int, request: Request, admin_session: Session):
    """Delegate staff credential verification to staff-registration service, then issue JWT."""
    # Use Docker service DNS name by default so inter-container calls succeed.
    # Allow override via STAFF_SERVICE_URL for flexibility in other environments.
    staff_service_url = os.getenv("STAFF_SERVICE_URL", "http://admin-staff-management:8006/api/v1")
    logger.debug(f"Staff service base URL resolved to: {staff_service_url}")

    # Call staff verify endpoint
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                f"{staff_service_url}/staff-auth/verify",
                data={"firm_id": str(firm_id), "username": username, "password": password},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        except Exception as e:
            logger.error(f"Staff verify call failed: {e}")
            return create_error_response(
                message="Authentication service unreachable",
                status_code=status.HTTP_502_BAD_GATEWAY,
                error_code="UPSTREAM_ERROR",
            )

    if resp.status_code >= 400:
        logger.warning(f"Staff verify HTTP {resp.status_code}: {resp.text}")
        return create_error_response(
            message="Staff verification failed",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS",
        )

    body = resp.json() if resp.content else {}
    if not body.get("success"):
        return create_error_response(
            message=body.get("message", "Invalid credentials"),
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS",
        )

    staff = body.get("data") or {}

    # Create access token for staff
    token_data = {
        "sub": str(staff.get("id")),
        "username": staff.get("username"),
        "firm_id": staff.get("firm_id"),
        "user_type": "staff",
    }

    access_token = create_access_token(data=token_data)

    # Best-effort: record a login session server-side as well
    try:
        ua = request.headers.get("user-agent") if request else None
        ip = None
        try:
            ip = request.client.host if request and request.client else None
        except Exception:
            ip = None
        item = LoginSession(
            staff_id=int(staff.get("id")),
            firm_id=int(staff.get("firm_id")),
            ip=ip,
            user_agent=ua,
        )
        admin_session.add(item)
        admin_session.commit()
    except Exception as e:
        logger.warning(f"Failed to record login session: {e}")

    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Login successful",
        timestamp=datetime.utcnow(),
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": staff.get("id"),
            "firm_id": staff.get("firm_id"),
            "username": staff.get("username"),
            "user_type": "staff",
            "user_details": {
                "name": staff.get("name"),
                "email": staff.get("email"),
                "phone": staff.get("phone"),
                "profile_image_path": staff.get("profile_image_path"),
            },
        },
        errors=None,
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

# Client Google Login
@router.post(
    "/auth/client/google-login/",
    summary="Client Google Login",
    description="Login client with Google OAuth",
    responses={
        200: {"description": "Login successful"},
        404: {"description": "Client not found"}
    }
)
async def client_google_login(
    google_id: str = Form(..., description="Google ID from OAuth"),
    email: str = Form(..., description="Email from Google OAuth"),
    session: Session = Depends(get_client_session)
):
    """Login client with Google OAuth."""
    try:
        # Find client by Google ID or email
        client = session.exec(
            select(Client).where(
                (Client.google_id == google_id) |
                (Client.email == email)
            )
        ).first()

        if not client:
            return create_error_response(
                message="Client not found. Please register first.",
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="CLIENT_NOT_FOUND"
            )

        # Create access token
        access_token = create_access_token(data={
            "sub": str(client.id),
            "username": client.username,
            "user_type": "client"
        })

        # Prepare response
        client_response = ClientResponse(
            id=client.id,
            full_name=client.full_name,
            username=client.username,
            email=client.email,
            phone=client.phone,
            profile_image_path=client.profile_image_path,
            is_google_user=client.is_google_user,
            is_verified=client.is_verified,
            created_at=client.created_at
        )

        login_response = ClientLoginResponse(
            client=client_response,
            access_token=access_token
        )

        response = StandardResponse(
            status=ResponseStatus.SUCCESS,
            message="Google login successful",
            timestamp=datetime.utcnow(),
            data=login_response.model_dump()
        )

        return JSONResponse(
            status_code=200,
            content=json.loads(response.model_dump_json())
        )

    except Exception as e:
        logger.error(f"Client Google login error: {str(e)}")
        return create_error_response(
            message="Login failed due to server error",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="SERVER_ERROR"
        )

# Unified Forgot Password Endpoint
@router.post(
    "/auth/forgot-password/",
    summary="Unified forgot password for both admin and client users",
    description="""
    Request a password reset for admin or client users. Sends an OTP to the user's email.
    The OTP expires after 15 minutes.
    
    For admin users:
    - Uses email field from User table
    - Must have credentials (is admin)
    
    For client users:
    - Uses contact field (email or phone)
    - Can be email or phone based contact
    """,
    responses={
        200: {"description": "Password reset email sent"},
        404: {"description": "Email not found"},
        400: {"description": "Invalid user type"}
    }
)
async def unified_forgot_password(
    contact: str = Form(..., description="Email address (admin) or email/phone (client)"),
    user_type: str = Form(..., description="User type: 'admin' or 'client'"),
    admin_session: Session = Depends(get_session),
    client_session: Session = Depends(get_client_session)
):
    """Unified forgot password for both admin and client users."""
    try:
        if user_type not in ["admin", "client"]:
            return create_error_response(
                message="Invalid user type. Must be 'admin' or 'client'",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="INVALID_USER_TYPE"
            )

        if user_type == "admin":
            return await _admin_forgot_password(contact, admin_session)
        else:
            return await _client_forgot_password(contact, client_session)

    except Exception as e:
        logger.error(f"Error in {user_type} forgot password: {str(e)}")
        return create_error_response(
            message=f"Failed to process password reset: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="SERVER_ERROR"
        )

async def _admin_forgot_password(email: str, session: Session):
    """Handle admin forgot password logic."""
    # Find user by email
    user_stmt = select(User).where(User.email == email)
    user = session.exec(user_stmt).first()

    if not user:
        return create_error_response(
            message="Email address not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="EMAIL_NOT_FOUND"
        )

    # Check if user has credentials (is admin)
    if not user.credentials:
        return create_error_response(
            message="No admin account found for this email",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_ADMIN_USER"
        )

    # Generate OTP and reset token
    otp_code = str(random.randint(100000, 999999))  # 6-digit OTP
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=15)  # 15-minute expiry

    # Delete any existing reset tokens for this email
    existing_tokens = session.exec(
        select(PasswordReset).where(PasswordReset.email == email)
    ).all()
    for token in existing_tokens:
        session.delete(token)

    # Create new password reset record
    password_reset = PasswordReset(
        email=email,
        otp_code=otp_code,
        token=reset_token,
        expires_at=expires_at,
        user_id=user.id
    )
    session.add(password_reset)
    session.commit()

    # Send email
    try:
        await send_reset_password_email(email, otp_code, user.first_name)
        logger.info(f"Password reset email sent to: {email}")
    except Exception as email_error:
        logger.error(f"Failed to send email: {str(email_error)}")

    # Create success response
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Password reset OTP sent to your email",
        timestamp=datetime.utcnow(),
        data={
            "reset_token": reset_token,
            "expires_in": 900,  # 15 minutes in seconds
            "user_type": "admin"
        },
        errors=None
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

async def _client_forgot_password(contact: str, session: Session):
    """Handle client forgot password logic."""
    # Determine if contact is email or phone
    email = contact if is_email(contact) else None
    phone = contact if is_phone_number(contact) else None

    if not email and not phone:
        return create_error_response(
            message="Contact must be a valid email address or phone number",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_CONTACT",
            field="contact"
        )

    # Find client by email or phone
    if email:
        client = session.exec(select(Client).where(Client.email == email)).first()
    else:
        client = session.exec(select(Client).where(Client.phone == phone)).first()

    if not client:
        return create_error_response(
            message="Contact not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="CONTACT_NOT_FOUND"
        )

    # Check if it's a Google user
    if client.is_google_user:
        return create_error_response(
            message="Google users cannot reset password. Please login with Google.",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="GOOGLE_USER"
        )

    # Generate OTP and reset token
    otp_code = str(random.randint(100000, 999999))  # 6-digit OTP
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=15)  # 15-minute expiry

    # Delete any existing reset tokens for this client
    existing_tokens = session.exec(
        select(ClientPasswordReset).where(ClientPasswordReset.username == client.username)
    ).all()
    for token in existing_tokens:
        session.delete(token)

    # Create new password reset record
    password_reset = ClientPasswordReset(
        username=client.username,
        email=email,
        phone=phone,
        reset_token=reset_token,
        otp_code=otp_code,
        expires_at=expires_at
    )
    session.add(password_reset)
    session.commit()

    # Send email/SMS (implement SMS later)
    try:
        if email:
            await send_reset_password_email(email, otp_code, client.full_name)
            logger.info(f"Password reset email sent to: {email}")
        # TODO: Implement SMS sending for phone numbers
    except Exception as email_error:
        logger.error(f"Failed to send email: {str(email_error)}")

    # Create success response
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Password reset OTP sent to your contact",
        timestamp=datetime.utcnow(),
        data={
            "reset_token": reset_token,
            "expires_in": 900,  # 15 minutes in seconds
            "user_type": "client"
        },
        errors=None
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

# Unified Verify Reset OTP Endpoint
@router.post(
    "/auth/verify-reset-otp/",
    summary="Unified verify password reset OTP",
    description="""
    Verify the OTP sent to user's email/phone and get authorization to reset password.
    Works for both admin and client users.
    """,
    responses={
        200: {"description": "OTP verified successfully"},
        400: {"description": "Invalid or expired OTP"}
    }
)
async def unified_verify_reset_otp(
    reset_token: str = Form(..., description="Reset token received in forgot password response"),
    otp_code: str = Form(..., description="6-digit OTP sent to email/phone"),
    user_type: str = Form(..., description="User type: 'admin' or 'client'"),
    admin_session: Session = Depends(get_session),
    client_session: Session = Depends(get_client_session)
):
    """Unified verify password reset OTP."""
    try:
        if user_type not in ["admin", "client"]:
            return create_error_response(
                message="Invalid user type. Must be 'admin' or 'client'",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="INVALID_USER_TYPE"
            )

        if user_type == "admin":
            return await _admin_verify_reset_otp(reset_token, otp_code, admin_session)
        else:
            return await _client_verify_reset_otp(reset_token, otp_code, client_session)

    except Exception as e:
        logger.error(f"Error verifying {user_type} reset OTP: {str(e)}")
        return create_error_response(
            message=f"Failed to verify OTP: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="SERVER_ERROR"
        )

async def _admin_verify_reset_otp(reset_token: str, otp_code: str, session: Session):
    """Handle admin verify reset OTP logic."""
    # Find the password reset record
    reset_stmt = select(PasswordReset).where(
        PasswordReset.token == reset_token,
        PasswordReset.is_used == False
    )
    reset_record = session.exec(reset_stmt).first()

    if not reset_record:
        return create_error_response(
            message="Invalid reset token",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_TOKEN"
        )

    # Check if token is expired
    if datetime.utcnow() > reset_record.expires_at:
        return create_error_response(
            message="Reset token has expired",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="TOKEN_EXPIRED"
        )

    # Verify OTP
    if reset_record.otp_code != otp_code:
        return create_error_response(
            message="Invalid OTP code",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_OTP"
        )

    # Get user information
    user_stmt = select(User).where(User.email == reset_record.email)
    user = session.exec(user_stmt).first()

    if not user or not user.credentials:
        return create_error_response(
            message="User not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="USER_NOT_FOUND"
        )

    # Create success response
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="OTP verified successfully",
        timestamp=datetime.utcnow(),
        data={
            "verified": True,
            "username": user.credentials.username,
            "user_id": user.id,
            "reset_token": reset_token,
            "full_name": f"{user.first_name} {user.last_name}",
            "user_type": "admin"
        },
        errors=None
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

async def _client_verify_reset_otp(reset_token: str, otp_code: str, session: Session):
    """Handle client verify reset OTP logic."""
    # Find the password reset record
    reset_stmt = select(ClientPasswordReset).where(
        ClientPasswordReset.reset_token == reset_token,
        ClientPasswordReset.is_used == False
    )
    reset_record = session.exec(reset_stmt).first()

    if not reset_record:
        return create_error_response(
            message="Invalid reset token",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_TOKEN"
        )

    # Check if token is expired
    if datetime.utcnow() > reset_record.expires_at:
        return create_error_response(
            message="Reset token has expired",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="TOKEN_EXPIRED"
        )

    # Verify OTP
    if reset_record.otp_code != otp_code:
        return create_error_response(
            message="Invalid OTP code",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_OTP"
        )

    # Get client information
    client_stmt = select(Client).where(Client.username == reset_record.username)
    client = session.exec(client_stmt).first()

    if not client:
        return create_error_response(
            message="Client not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="CLIENT_NOT_FOUND"
        )

    # Create success response
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="OTP verified successfully",
        timestamp=datetime.utcnow(),
        data={
            "verified": True,
            "username": client.username,
            "user_id": client.id,
            "reset_token": reset_token,
            "full_name": client.full_name,
            "user_type": "client"
        },
        errors=None
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

# Unified Reset Password Endpoint
@router.post(
    "/auth/reset-password/",
    summary="Unified reset password with verified token",
    description="""
    Reset the password after OTP verification. The reset token must be verified first.
    Works for both admin and client users.
    """,
    responses={
        200: {"description": "Password reset successfully"},
        400: {"description": "Invalid token or validation error"}
    }
)
async def unified_reset_password(
    reset_token: str = Form(..., description="Verified reset token"),
    new_password: str = Form(..., description="New password"),
    confirm_password: str = Form(..., description="Confirm new password"),
    user_type: str = Form(..., description="User type: 'admin' or 'client'"),
    admin_session: Session = Depends(get_session),
    client_session: Session = Depends(get_client_session)
):
    """Unified reset password with verified token."""
    try:
        if user_type not in ["admin", "client"]:
            return create_error_response(
                message="Invalid user type. Must be 'admin' or 'client'",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="INVALID_USER_TYPE"
            )

        # Validate password confirmation
        if new_password != confirm_password:
            return create_error_response(
                message="Passwords do not match",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="PASSWORD_MISMATCH"
            )
        
        # Validate password strength (basic validation)
        if len(new_password) < 8:
            return create_error_response(
                message="Password must be at least 8 characters long",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="WEAK_PASSWORD"
            )
        
        if user_type == "admin":
            return await _admin_reset_password(reset_token, new_password, admin_session)
        else:
            return await _client_reset_password(reset_token, new_password, client_session)

    except Exception as e:
        logger.error(f"Error resetting {user_type} password: {str(e)}")
        return create_error_response(
            message=f"Failed to reset password: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="SERVER_ERROR"
        )

async def _admin_reset_password(reset_token: str, new_password: str, session: Session):
    """Handle admin reset password logic."""
    # Find the password reset record
    reset_stmt = select(PasswordReset).where(
        PasswordReset.token == reset_token,
        PasswordReset.is_used == False
    )
    reset_record = session.exec(reset_stmt).first()

    if not reset_record:
        return create_error_response(
            message="Invalid or already used reset token",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_TOKEN"
        )

    # Check if token is expired
    if datetime.utcnow() > reset_record.expires_at:
        return create_error_response(
            message="Reset token has expired",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="TOKEN_EXPIRED"
        )

    # Find user and credentials
    user_stmt = select(User).where(User.email == reset_record.email)
    user = session.exec(user_stmt).first()

    if not user or not user.credentials:
        return create_error_response(
            message="User not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="USER_NOT_FOUND"
        )

    # Update password
    hashed_password = get_password_hash(new_password)
    user.credentials.password_hash = hashed_password
    user.credentials.updated_at = datetime.utcnow()

    # Mark reset token as used
    reset_record.is_used = True

    # Commit changes
    session.add(user.credentials)
    session.add(reset_record)
    session.commit()

    logger.info(f"Password reset successfully for admin user: {user.email}")

    # Create success response
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Password reset successfully",
        timestamp=datetime.utcnow(),
        data={
            "success": True,
            "user_type": "admin"
        },
        errors=None
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

async def _client_reset_password(reset_token: str, new_password: str, session: Session):
    """Handle client reset password logic."""
    # Find the password reset record
    reset_stmt = select(ClientPasswordReset).where(
        ClientPasswordReset.reset_token == reset_token,
        ClientPasswordReset.is_used == False
    )
    reset_record = session.exec(reset_stmt).first()

    if not reset_record:
        return create_error_response(
            message="Invalid or already used reset token",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_TOKEN"
        )

    # Check if token is expired
    if datetime.utcnow() > reset_record.expires_at:
        return create_error_response(
            message="Reset token has expired",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="TOKEN_EXPIRED"
        )

    # Find client and credentials
    client_stmt = select(Client).where(Client.username == reset_record.username)
    client = session.exec(client_stmt).first()

    if not client or not client.credentials:
        return create_error_response(
            message="Client not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="CLIENT_NOT_FOUND"
        )

    # Update password
    hashed_password = get_password_hash(new_password)
    client.credentials.password_hash = hashed_password
    client.credentials.updated_at = datetime.utcnow()

    # Mark reset token as used
    reset_record.is_used = True

    # Commit changes
    session.add(client.credentials)
    session.add(reset_record)
    session.commit()

    logger.info(f"Password reset successfully for client: {client.username}")

    # Create success response
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Password reset successfully",
        timestamp=datetime.utcnow(),
        data={
            "success": True,
            "user_type": "client"
        },
        errors=None
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

# Unified Change Password Endpoint
@router.post(
    "/auth/change-password/",
    summary="Unified change password for authenticated users",
    description="""
    Change password for authenticated users (admin or client).
    Requires current password verification.
    """,
    responses={
        200: {"description": "Password changed successfully"},
        401: {"description": "Current password is incorrect"},
        400: {"description": "Password validation error"}
    }
)
async def unified_change_password(
    username: str = Form(..., description="Username of the user"),
    current_password: str = Form(..., description="Current password"),
    new_password: str = Form(..., description="New password"),
    confirm_password: str = Form(..., description="Confirm new password"),
    user_type: str = Form(..., description="User type: 'admin' or 'client'"),
    admin_session: Session = Depends(get_session),
    client_session: Session = Depends(get_client_session)
):
    """Unified change password for authenticated users."""
    try:
        if user_type not in ["admin", "client"]:
            return create_error_response(
                message="Invalid user type. Must be 'admin' or 'client'",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="INVALID_USER_TYPE"
            )

        # Validate password confirmation
        if new_password != confirm_password:
            return create_error_response(
                message="New passwords do not match",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="PASSWORD_MISMATCH"
            )

        # Validate password strength
        if len(new_password) < 8:
            return create_error_response(
                message="Password must be at least 8 characters long",
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="WEAK_PASSWORD"
            )

        if user_type == "admin":
            return await _admin_change_password(username, current_password, new_password, admin_session)
        else:
            return await _client_change_password(username, current_password, new_password, client_session)

    except Exception as e:
        logger.error(f"Error changing {user_type} password: {str(e)}")
        return create_error_response(
            message=f"Failed to change password: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="SERVER_ERROR"
        )

async def _admin_change_password(username: str, current_password: str, new_password: str, session: Session):
    """Handle admin change password logic."""
    # Find credentials by username
    credentials = session.exec(
        select(Credentials).where(Credentials.username == username)
    ).first()

    if not credentials:
        return create_error_response(
            message="User not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="USER_NOT_FOUND"
        )

    # Verify current password
    if not verify_password(current_password, credentials.password_hash):
        return create_error_response(
            message="Current password is incorrect",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CURRENT_PASSWORD"
        )

    # Update password
    hashed_password = get_password_hash(new_password)
    credentials.password_hash = hashed_password
    credentials.updated_at = datetime.utcnow()

    # Commit changes
    session.add(credentials)
    session.commit()

    logger.info(f"Password changed successfully for admin user: {username}")

    # Create success response
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Password changed successfully",
        timestamp=datetime.utcnow(),
        data={
            "success": True,
            "user_type": "admin"
        },
        errors=None
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

async def _client_change_password(username: str, current_password: str, new_password: str, session: Session):
    """Handle client change password logic."""
    # Find client by username
    client = session.exec(
        select(Client).where(Client.username == username)
    ).first()

    if not client:
        return create_error_response(
            message="Client not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="CLIENT_NOT_FOUND"
        )

    # Check if it's a Google user
    if client.is_google_user:
        return create_error_response(
            message="Google users cannot change password. Manage your password through Google.",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="GOOGLE_USER"
        )

    # Verify current password
    if not client.credentials or not verify_password(current_password, client.credentials.password_hash):
        return create_error_response(
            message="Current password is incorrect",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CURRENT_PASSWORD"
        )

    # Update password
    hashed_password = get_password_hash(new_password)
    client.credentials.password_hash = hashed_password
    client.credentials.updated_at = datetime.utcnow()

    # Commit changes
    session.add(client.credentials)
    session.commit()

    logger.info(f"Password changed successfully for client: {username}")

    # Create success response
    response = StandardResponse(
        status=ResponseStatus.SUCCESS,
        message="Password changed successfully",
        timestamp=datetime.utcnow(),
        data={
            "success": True,
            "user_type": "client"
        },
        errors=None
    )

    return JSONResponse(content=json.loads(response.model_dump_json()))

