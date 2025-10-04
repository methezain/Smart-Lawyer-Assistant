from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.model.staff import Staff
from app.utils.crypto import decrypt
from app.schema.staff import ResponseBase


router = APIRouter(prefix="/staff-auth", tags=["staff-auth"]) 


@router.post("/verify", response_model=ResponseBase)
def verify_staff_credentials(
    firm_id: int = Form(..., description="Firm ID to which the staff belongs"),
    username: str = Form(..., description="Staff username"),
    password: str = Form(..., description="Staff password"),
    session: Session = Depends(get_session),
):
    """Verify staff username/password for a given firm.

    Note: This uses reversible demo encryption for prototype purposes only.
    """
    stmt = select(Staff).where(Staff.username == username, Staff.firm_id == firm_id)
    staff = session.exec(stmt).first()

    if not staff:
        return ResponseBase(success=False, message="Invalid credentials", data=None)

    if not staff.password_encrypted:
        return ResponseBase(success=False, message="No password set for this account", data=None)

    try:
        actual = decrypt(staff.password_encrypted)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Password decode failed")

    if actual != password:
        return ResponseBase(success=False, message="Invalid credentials", data=None)

    return ResponseBase(
        success=True,
        message="Login verified",
        data={
            "id": staff.id,
            "username": staff.username,
            "name": staff.name,
            "email": staff.email,
            "phone": staff.phone,
            "firm_id": staff.firm_id,
            "is_active": staff.is_active,
        },
    )
