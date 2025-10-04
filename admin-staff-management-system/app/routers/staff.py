from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from sqlmodel import Session, select
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from app.database import get_session
from app.utils.crypto import encrypt, decrypt
from app.model.staff import Staff
from app.schema.staff import StaffCreate, StaffRead, StaffUpdate, ResponseBase
from app.auth import get_current_user, get_current_admin_user, JWTTokenData

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("/", response_model=List[StaffRead])
def list_staff(
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user),
):
    # Only list staff for the current user's firm
    stmt = select(Staff).where(Staff.firm_id == current_user.firm_id)
    return session.exec(stmt).all()


@router.get("/{staff_id}", response_model=StaffRead)
def get_staff(
    staff_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user),
):
    staff = session.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff


@router.post("/", response_model=StaffRead, status_code=status.HTTP_201_CREATED)
def create_staff(
    payload: StaffCreate,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_admin_user),
):
    # Here, password handling would happen in a real system (hashing + user account creation)
    staff = Staff(
        name=payload.name,
        username=payload.username,
        role=payload.role,
        specialization=payload.specialization,
        experience=payload.experience,
        email=payload.email,
        phone=payload.phone,
        join_date=payload.join_date,
        address=payload.address,
        bio=payload.bio,
        education=payload.education or [],
        bar_associations=payload.bar_associations or [],
        avatar_url=payload.avatar_url,
        firm_id=current_user.firm_id,
    is_active=True,
    password_encrypted=encrypt(payload.password),
    password_length=len(payload.password or ""),
        created_at=datetime.utcnow().isoformat(),
        updated_at=datetime.utcnow().isoformat(),
    )
    try:
        session.add(staff)
        session.commit()
        session.refresh(staff)
        return staff
    except IntegrityError as e:
        session.rollback()
        # Likely unique constraint on email
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A staff member with this email already exists",
        )


@router.post("/{staff_id}/reveal-password")
def reveal_staff_password(
    staff_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_admin_user),
):
    """Reveal a staff member's password to an authenticated admin of the same firm.
    For demo purposes only; do not use in production.
    """
    staff = session.get(Staff, staff_id)
    if not staff or staff.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail="Staff not found")
    if not staff.password_encrypted:
        raise HTTPException(status_code=404, detail="No password stored")
    return {"password": decrypt(staff.password_encrypted)}


@router.put("/{staff_id}", response_model=StaffRead)
def update_staff(
    staff_id: int,
    payload: StaffUpdate,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_admin_user),
):
    staff = session.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    update_data = payload.dict(exclude_unset=True)
    for k, v in update_data.items():
        if k == "password" and v:
            staff.password_encrypted = encrypt(v)
            staff.password_length = len(v)
        else:
            setattr(staff, k, v)
    staff.updated_at = datetime.utcnow().isoformat()

    try:
        session.add(staff)
        session.commit()
        session.refresh(staff)
        return staff
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A staff member with this email already exists",
        )


@router.delete("/{staff_id}", response_model=ResponseBase)
def delete_staff(
    staff_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_admin_user),
):
    staff = session.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    session.delete(staff)
    session.commit()
    return ResponseBase(success=True, message="Staff deleted", data={"id": staff_id})
