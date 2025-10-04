from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.models.database import get_session
from app.utils.security import decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.login_session import LoginSession
from app.schemas.login_session import (
    LoginSessionCreate,
    LoginSessionEnd,
    LoginSessionRead,
)


security = HTTPBearer()
router = APIRouter(prefix="/auth/login-activity", tags=["Login Activity"])


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload


@router.get("/{staff_id}", response_model=List[LoginSessionRead])
def list_login_sessions(
    staff_id: int,
    session: Session = Depends(get_session),
    token: dict = Depends(get_current_user),
):
    firm_id = token.get("firm_id")
    stmt = (
        select(LoginSession)
        .where(LoginSession.staff_id == staff_id, LoginSession.firm_id == firm_id)
        .order_by(LoginSession.login_at.desc())
    )
    return session.exec(stmt).all()


@router.post("/{staff_id}", response_model=LoginSessionRead, status_code=status.HTTP_201_CREATED)
def start_login_session(
    staff_id: int,
    payload: LoginSessionCreate,
    session: Session = Depends(get_session),
    token: dict = Depends(get_current_user),
):
    firm_id = token.get("firm_id")
    # If an open session already exists, return it to avoid duplicates
    existing_stmt = (
        select(LoginSession)
        .where(
            LoginSession.staff_id == staff_id,
            LoginSession.firm_id == firm_id,
            LoginSession.logout_at.is_(None),
        )
        .order_by(LoginSession.login_at.desc())
    )
    existing = session.exec(existing_stmt).first()
    if existing:
        return existing

    # Normalize provided login_at to UTC-aware; if not provided, use now(UTC)
    login_at_val = payload.login_at or datetime.now(timezone.utc)
    if login_at_val.tzinfo is None:
        # assume incoming naive timestamp is UTC
        login_at_val = login_at_val.replace(tzinfo=timezone.utc)

    item = LoginSession(
        staff_id=staff_id,
        firm_id=firm_id,
        login_at=login_at_val,
        ip=payload.ip,
        user_agent=payload.user_agent,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.post("/{staff_id}/logout", response_model=LoginSessionRead)
def end_login_session(
    staff_id: int,
    payload: LoginSessionEnd,
    session: Session = Depends(get_session),
    token: dict = Depends(get_current_user),
):
    firm_id = token.get("firm_id")
    # Find most recent open session
    stmt = (
        select(LoginSession)
        .where(
            LoginSession.staff_id == staff_id,
            LoginSession.firm_id == firm_id,
            LoginSession.logout_at.is_(None),
        )
        .order_by(LoginSession.login_at.desc())
    )
    last_open = session.exec(stmt).first()
    if not last_open:
        raise HTTPException(status_code=404, detail="No active session to close")
    # Normalize logout_at to UTC-aware
    logout_at_val = payload.logout_at or datetime.now(timezone.utc)
    if logout_at_val.tzinfo is None:
        logout_at_val = logout_at_val.replace(tzinfo=timezone.utc)
    # Ensure login_at is also timezone-aware UTC for diff
    if last_open.login_at and last_open.login_at.tzinfo is None:
        last_open.login_at = last_open.login_at.replace(tzinfo=timezone.utc)

    last_open.logout_at = logout_at_val
    # Compute and persist duration in whole minutes (non-negative)
    try:
        delta = (last_open.logout_at - last_open.login_at).total_seconds()
        minutes = int(max(0, delta // 60))
        last_open.duration_minutes = minutes
    except Exception:
        last_open.duration_minutes = None
    session.add(last_open)
    session.commit()
    session.refresh(last_open)
    return last_open
