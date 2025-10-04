import json
import re
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
import logging
from datetime import datetime, timedelta
from typing import Optional, List
import secrets
import random

from app.models.client_database import get_client_session
from app.models.client_registration import Client, ClientCredentials, ClientPasswordReset
from app.schemas.client_registration import (
    ClientRegistrationRequest, ClientGoogleRegistrationRequest,
    ClientResponse, ClientLoginResponse
)
from app.schemas.registration import (
    ErrorDetail, ResponseStatus, StandardResponse
)
from app.utils.security import get_password_hash, verify_password, create_access_token, decode_token
from app.utils.file_handler import save_upload_file
from app.utils.email import send_registration_confirmation, send_reset_password_email, send_client_registration_confirmation

# Create router
router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

@router.post(
    "/registration/client/signup",
    summary="Client Registration (Signin)",
    description="Register a new client with contact (email/phone), password, full name, and username",
    responses={
        200: {"description": "Registration successful"},
        400: {"description": "Registration failed - validation error"},
        409: {"description": "Username, email, or phone already exists"}
    }
)
async def client_signup(
    registration_data: ClientRegistrationRequest,
    session: Session = Depends(get_client_session)
):
    """Register a new client (equivalent to ClientSignin.jsx)."""
    try:
        # Determine if contact is email or phone
        contact = registration_data.contact
        email = contact if is_email(contact) else None
        phone = contact if is_phone_number(contact) else None

        if not email and not phone:
            return create_error_response(
                message="Contact must be a valid email address or phone number",
                status_code=400,
                error_code="INVALID_CONTACT",
                field="contact"
            )

        # Check if username already exists
        existing_username = session.exec(
            select(Client).where(Client.username == registration_data.username)
        ).first()

        if existing_username:
            return create_error_response(
                message="Username already exists",
                status_code=409,
                error_code="USERNAME_EXISTS",
                field="username"
            )

        # Check if email already exists (if provided)
        if email:
            existing_email = session.exec(
                select(Client).where(Client.email == email)
            ).first()

            if existing_email:
                return create_error_response(
                    message="Email already registered",
                    status_code=409,
                    error_code="EMAIL_EXISTS",
                    field="email"
                )

        # Check if phone already exists (if provided)
        if phone:
            existing_phone = session.exec(
                select(Client).where(Client.phone == phone)
            ).first()

            if existing_phone:
                return create_error_response(
                    message="Phone number already registered",
                    status_code=409,
                    error_code="PHONE_EXISTS",
                    field="phone"
                )

        # Create client credentials
        password_hash = get_password_hash(registration_data.password)
        credentials = ClientCredentials(
            username=registration_data.username,
            password_hash=password_hash
        )
        session.add(credentials)
        session.commit()
        session.refresh(credentials)

        # Create client
        client = Client(
            full_name=registration_data.full_name,
            username=registration_data.username,
            email=email,
            phone=phone,
            credentials_id=credentials.id,
            is_verified=True  # Auto-verify for now, implement email/SMS verification later
        )
        session.add(client)
        session.commit()
        session.refresh(client)

        # Create access token
        access_token = create_access_token(data={"sub": client.username, "type": "client"})

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

        # Send registration confirmation email (if email is provided)
        email_sent = False
        if email:
            try:
                client_data = {
                    "email": email,
                    "full_name": client.full_name,
                    "username": client.username,
                    "phone": client.phone,
                    "registration_date": client.created_at.strftime("%B %d, %Y")
                }
                email_sent = send_client_registration_confirmation(client_data)

                if email_sent:
                    logger.info(f"Registration confirmation email sent to {email}")
                else:
                    logger.warning(f"Failed to send registration confirmation email to {email}")
            except Exception as email_error:
                logger.error(f"Error sending registration email: {str(email_error)}")
                email_sent = False

        # Update response data to include email status
        response_data = login_response.model_dump()
        response_data["email_sent"] = email_sent
        response_data["email_message"] = "Welcome email sent!" if email_sent else "Registration successful, but welcome email could not be sent."

        response = StandardResponse(
            status=ResponseStatus.SUCCESS,
            message="Client registration successful",
            timestamp=datetime.utcnow(),
            data=response_data
        )

        return JSONResponse(
            status_code=200,
            content=json.loads(response.model_dump_json())
        )

    except Exception as e:
        logger.error(f"Client registration error: {str(e)}")
        return create_error_response(
            message="Registration failed due to server error",
            status_code=500,
            error_code="SERVER_ERROR"
        )

@router.post(
    "/registration/client/google-signup",
    summary="Client Google Registration",
    description="Register a new client with Google OAuth",
    responses={
        200: {"description": "Registration successful"},
        400: {"description": "Registration failed - validation error"},
        409: {"description": "Email or username already exists"}
    }
)
async def client_google_signup(
    registration_data: ClientGoogleRegistrationRequest,
    session: Session = Depends(get_client_session)
):
    """Register a new client with Google OAuth."""
    try:
        # Check if username already exists
        existing_username = session.exec(
            select(Client).where(Client.username == registration_data.username)
        ).first()

        if existing_username:
            return create_error_response(
                message="Username already exists",
                status_code=409,
                error_code="USERNAME_EXISTS",
                field="username"
            )

        # Check if email already exists
        existing_email = session.exec(
            select(Client).where(Client.email == registration_data.email)
        ).first()

        if existing_email:
            return create_error_response(
                message="Email already registered",
                status_code=409,
                error_code="EMAIL_EXISTS",
                field="email"
            )

        # Check if Google ID already exists
        existing_google = session.exec(
            select(Client).where(Client.google_id == registration_data.google_id)
        ).first()

        if existing_google:
            return create_error_response(
                message="Google account already registered",
                status_code=409,
                error_code="GOOGLE_EXISTS"
            )

        # Create client credentials (no password for Google users)
        credentials = ClientCredentials(
            username=registration_data.username,
            password_hash=None
        )
        session.add(credentials)
        session.commit()
        session.refresh(credentials)

        # Create client
        client = Client(
            full_name=registration_data.full_name,
            username=registration_data.username,
            email=registration_data.email,
            google_id=registration_data.google_id,
            is_google_user=True,
            credentials_id=credentials.id,
            is_verified=True
        )
        session.add(client)
        session.commit()
        session.refresh(client)

        # Create access token
        access_token = create_access_token(data={"sub": client.username, "type": "client"})

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
            message="Client Google registration successful",
            timestamp=datetime.utcnow(),
            data=login_response.model_dump()
        )

        return JSONResponse(
            status_code=200,
            content=json.loads(response.model_dump_json())
        )

    except Exception as e:
        logger.error(f"Client Google registration error: {str(e)}")
        return create_error_response(
            message="Registration failed due to server error",
            status_code=500,
            error_code="SERVER_ERROR"
        )
