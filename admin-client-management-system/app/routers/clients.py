from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from sqlmodel import Session, select
from sqlalchemy import func, or_
from datetime import datetime, date

from app.database import get_session
from app.models import Client, ClientType
from app.schemas import (
    ClientCreate, ClientUpdate, ClientRead,
    ClientResponse, ClientListResponse, ResponseBase
)
from app.utils import calculate_pagination
from app.auth import get_current_user, get_user_firm_filter

router = APIRouter(
    prefix="/clients",
    tags=["clients"],
    dependencies=[Depends(get_current_user)],  # Require JWT on all endpoints
)


def _to_read(r: Client) -> ClientRead:
    return ClientRead(
        id=r.id,
        name=r.name,
        email=r.email,
        phone=r.phone,
        address=r.address,
        type=r.type,
        onlineStatus=r.onlineStatus,
        cnic=r.cnic,
        occupation=r.occupation,
        nationality=r.nationality,
        religion=r.religion,
        maritalStatus=r.maritalStatus,
        gender=r.gender,
        ntn=r.ntn,
        industry=r.industry,
        contactPerson=r.contactPerson,
        notes=r.notes,
        joinDate=r.joinDate,
        totalCases=r.totalCases,
        activeCases=r.activeCases,
    pastCases=r.pastCases,
    pendingCases=r.pendingCases or 0,
    closedCases=r.closedCases or 0,
    case_id=r.case_id,
    case_status=r.case_status,
    assigned_lawyer_id=r.assigned_lawyer_id,
    assigned_lawyer_name=r.assigned_lawyer_name,
    )

@router.get("/", response_model=ClientListResponse)
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None),
    type: Optional[ClientType] = Query(None),
    marital_status: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    join_date_from: Optional[date] = Query(None),
    join_date_to: Optional[date] = Query(None),
    firm_id: int = Depends(get_user_firm_filter),
    session: Session = Depends(get_session),
):
    stmt = select(Client).where(Client.firm_id == firm_id)

    if search:
        like = f"%{search}%"
        # name, email, phone (case-insensitive)
        stmt = stmt.where(
            or_(
                func.lower(Client.name).like(func.lower(like)),
                func.lower(Client.email).like(func.lower(like)),
                func.lower(Client.phone).like(func.lower(like)),
            )
        )
    if type:
        stmt = stmt.where(Client.type == type)

    if marital_status:
        stmt = stmt.where(
            func.lower(func.trim(Client.maritalStatus)) == marital_status.lower().strip()
        )

    if gender:
        stmt = stmt.where(
            func.lower(func.trim(Client.gender)) == gender.lower().strip()
        )

    # Normalize date range (swap if provided in reverse)
    if join_date_from and join_date_to and join_date_to < join_date_from:
        join_date_from, join_date_to = join_date_to, join_date_from

    if join_date_from:
        stmt = stmt.where(Client.joinDate >= join_date_from)
    if join_date_to:
        stmt = stmt.where(Client.joinDate <= join_date_to)

    total = len(session.exec(stmt).all())

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = session.exec(stmt).all()

    # Convert to dicts
    items = [_to_read(r) for r in rows]

    pagination = calculate_pagination(page, page_size, total)
    return ClientListResponse(
        success=True,
        message=f"Retrieved {len(items)} clients",
        data={
            "clients": items,
            "pagination": pagination.dict(),
        }
    )

@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    firm_id: int = Depends(get_user_firm_filter),
    session: Session = Depends(get_session),
):
    # Basic validation
    if payload.type == ClientType.INDIVIDUAL and not payload.cnic:
        raise HTTPException(status_code=422, detail="CNIC is required for individual clients")
    if payload.type == ClientType.BUSINESS and not payload.ntn:
        raise HTTPException(status_code=422, detail="NTN is required for business clients")

    row = Client(**payload.model_dump())
    # Ensure row is scoped to the authenticated user's firm
    row.firm_id = firm_id
    session.add(row)
    session.commit()
    session.refresh(row)

    return ClientResponse(success=True, message="Client created", data=_to_read(row))

@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    firm_id: int = Depends(get_user_firm_filter),
    session: Session = Depends(get_session),
):
    row = session.exec(
        select(Client).where(Client.id == client_id, Client.firm_id == firm_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")
    return ClientResponse(success=True, message="Client fetched", data=_to_read(row))

@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    payload: ClientUpdate,
    firm_id: int = Depends(get_user_firm_filter),
    session: Session = Depends(get_session),
):
    row = session.exec(
        select(Client).where(Client.id == client_id, Client.firm_id == firm_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")

    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(row, k, v)
    row.updated_at = datetime.utcnow()

    session.add(row)
    session.commit()
    session.refresh(row)

    return ClientResponse(success=True, message="Client updated", data=_to_read(row))


@router.post("/{client_id}/link_case", response_model=ClientResponse)
async def link_case_to_client(
    client_id: int,
    case_id: int = Query(..., description="Case ID from Case Management service"),
    status: Optional[str] = Query(None, description="Case status: pending|active|closed"),
    staff_id: Optional[int] = Query(None, description="Deprecated: use assigned_lawyer_id"),
    staff_name: Optional[str] = Query(None, description="Deprecated: use assigned_lawyer_name"),
    assigned_lawyer_id: Optional[int] = Query(None, description="Assigned lawyer ID"),
    assigned_lawyer_name: Optional[str] = Query(None, description="Assigned lawyer display name"),
    firm_id: int = Depends(get_user_firm_filter),
    session: Session = Depends(get_session),
):
    """Link a case to a client and set assigned lawyer fields on the client.

    The client table now holds case_id and assigned lawyer info directly.
    Backwards-compatibility: staff_id/staff_name parameters are still accepted
    but mapped to assigned_lawyer_*.
    """
    row = session.exec(
        select(Client).where(Client.id == client_id, Client.firm_id == firm_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")

    # Back-compat param mapping
    if assigned_lawyer_id is None and staff_id is not None:
        assigned_lawyer_id = staff_id
    if assigned_lawyer_name is None and staff_name is not None:
        assigned_lawyer_name = staff_name

    # Update client linkage and counters
    # If linking a new case id (not the same as existing), adjust counters
    is_new_case_link = (row.case_id != case_id)
    row.case_id = case_id
    if status:
        row.case_status = status.lower()
    if assigned_lawyer_id is not None:
        row.assigned_lawyer_id = assigned_lawyer_id
    if assigned_lawyer_name is not None:
        row.assigned_lawyer_name = assigned_lawyer_name

    if is_new_case_link:
        # Initialize counters
        total = int(row.totalCases or 0)
        active = int(row.activeCases or 0)
        past = int(row.pastCases or 0)
        pending = int((row.pendingCases or 0))
        closed = int((row.closedCases or 0))

        # Increment totals
        total += 1
        status_norm = (status or "active").strip().lower()
        if status_norm == "pending":
            pending += 1
        elif status_norm == "closed":
            closed += 1
            past += 1
        else:
            active += 1

        row.totalCases = total
        row.activeCases = active
        row.pastCases = past
        row.pendingCases = pending
        row.closedCases = closed

    row.updated_at = datetime.utcnow()
    session.add(row)
    session.commit()
    session.refresh(row)

    return ClientResponse(success=True, message="Client linked to case", data=_to_read(row))


# Removed /{client_id}/cases since linkage is embedded in client rows now

@router.delete("/{client_id}", response_model=ResponseBase)
async def delete_client(
    client_id: int,
    firm_id: int = Depends(get_user_firm_filter),
    session: Session = Depends(get_session),
):
    row = session.exec(
        select(Client).where(Client.id == client_id, Client.firm_id == firm_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")

    session.delete(row)
    session.commit()
    return ResponseBase(success=True, message="Client deleted", data=None)
