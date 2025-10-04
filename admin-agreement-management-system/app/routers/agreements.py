from datetime import datetime, timezone
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.auth import get_current_user, JWTTokenData
from app.database import engine
from app.models import Agreement
from app.schemas import (
    AgreementCreate,
    AgreementUpdate,
    AgreementRead,
    AgreementListResponse,
    PaginationInfo,
)

router = APIRouter(prefix="/agreements", tags=["agreements"])

NOT_FOUND_MSG = "Agreement not found"


def get_session():
    with Session(engine) as session:
        yield session


@router.get("/", response_model=AgreementListResponse)
async def list_agreements(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    case_type: Optional[str] = Query(None),
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = select(Agreement).where(Agreement.firm_id == current_user.firm_id)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            (Agreement.title.ilike(like))
            | (Agreement.client.ilike(like))
            | (Agreement.law_firm.ilike(like))
        )
    if status:
        stmt = stmt.where(Agreement.status == status)
    if case_type:
        stmt = stmt.where(Agreement.case_type == case_type)

    results = session.exec(stmt)
    try:
        total = results.count()
    except Exception:
        all_items = results.all()
        total = len(all_items)

    stmt_paged = (
        stmt.order_by(Agreement.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = session.exec(stmt_paged).all()

    def to_read(a: Agreement) -> AgreementRead:
        terms = json.loads(a.terms_json) if a.terms_json else None
        documents = json.loads(a.documents_json) if a.documents_json else None
        return AgreementRead(
            id=a.id,
            firm_id=a.firm_id,
            title=a.title,
            case_type=a.case_type,
            status=a.status,
            client=a.client,
            client_cnic=a.client_cnic,
            client_address=a.client_address,
            law_firm=a.law_firm,
            amount=a.amount,
            currency=a.currency,
            contract_content=a.contract_content,
            filed_date=a.filed_date,
            expected_file_date=a.expected_file_date,
            effective_date=a.effective_date,
            contract_duration=a.contract_duration,
            termination_date=a.termination_date,
            terms=terms,
            documents=documents,
            created_by=a.created_by,
            updated_by=a.updated_by,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )

    total_pages = (total + page_size - 1) // page_size if page_size else 1
    return AgreementListResponse(
        agreements=[to_read(x) for x in items],
        pagination=PaginationInfo(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )


@router.post("/", response_model=AgreementRead)
async def create_agreement(
    data: AgreementCreate,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    a = Agreement(
        firm_id=current_user.firm_id,
        title=data.title,
        case_type=data.case_type,
        status=data.status or "Pending Signature",
        client=data.client,
        client_cnic=data.client_cnic,
        client_address=data.client_address,
        law_firm=data.law_firm,
        amount=data.amount,
        currency=data.currency or "PKR",
        contract_content=data.contract_content,
        filed_date=data.filed_date,
        expected_file_date=data.expected_file_date,
        effective_date=data.effective_date,
        contract_duration=data.contract_duration,
        termination_date=data.termination_date,
        terms_json=json.dumps(data.terms) if data.terms is not None else None,
        documents_json=json.dumps(data.documents) if data.documents is not None else None,
        created_by=current_user.user_id,
        updated_by=current_user.user_id,
    )
    session.add(a)
    session.commit()
    session.refresh(a)

    return AgreementRead(
        id=a.id,
        firm_id=a.firm_id,
        title=a.title,
        case_type=a.case_type,
        status=a.status,
        client=a.client,
        client_cnic=a.client_cnic,
        client_address=a.client_address,
        law_firm=a.law_firm,
        amount=a.amount,
        currency=a.currency,
        contract_content=a.contract_content,
        filed_date=a.filed_date,
        expected_file_date=a.expected_file_date,
        effective_date=a.effective_date,
        contract_duration=a.contract_duration,
        termination_date=a.termination_date,
        terms=data.terms,
        documents=data.documents,
        created_by=a.created_by,
        updated_by=a.updated_by,
        created_at=a.created_at,
        updated_at=a.updated_at,
    )


@router.get("/{agreement_id}", response_model=AgreementRead)
async def get_agreement(
    agreement_id: int,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    a = session.get(Agreement, agreement_id)
    if not a or a.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)

    return AgreementRead(
        id=a.id,
        firm_id=a.firm_id,
        title=a.title,
        case_type=a.case_type,
        status=a.status,
        client=a.client,
        client_cnic=a.client_cnic,
        client_address=a.client_address,
        law_firm=a.law_firm,
        amount=a.amount,
        currency=a.currency,
        contract_content=a.contract_content,
        filed_date=a.filed_date,
        expected_file_date=a.expected_file_date,
        effective_date=a.effective_date,
        contract_duration=a.contract_duration,
        termination_date=a.termination_date,
        terms=json.loads(a.terms_json) if a.terms_json else None,
        documents=json.loads(a.documents_json) if a.documents_json else None,
        created_by=a.created_by,
        updated_by=a.updated_by,
        created_at=a.created_at,
        updated_at=a.updated_at,
    )


@router.patch("/{agreement_id}", response_model=AgreementRead)
async def update_agreement(
    agreement_id: int,
    patch: AgreementUpdate,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    a = session.get(Agreement, agreement_id)
    if not a or a.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)

    data = patch.model_dump(exclude_unset=True)

    # Handle list fields separately
    terms = data.pop("terms", None)
    documents = data.pop("documents", None)
    if terms is not None:
        a.terms_json = json.dumps(terms)
    if documents is not None:
        a.documents_json = json.dumps(documents)

    for k, v in data.items():
        setattr(a, k, v)

    a.updated_by = current_user.user_id
    a.updated_at = datetime.now(timezone.utc)

    session.add(a)
    session.commit()
    session.refresh(a)

    return AgreementRead(
        id=a.id,
        firm_id=a.firm_id,
        title=a.title,
        case_type=a.case_type,
        status=a.status,
        client=a.client,
        client_cnic=a.client_cnic,
        client_address=a.client_address,
        law_firm=a.law_firm,
        amount=a.amount,
        currency=a.currency,
        contract_content=a.contract_content,
        filed_date=a.filed_date,
        expected_file_date=a.expected_file_date,
        effective_date=a.effective_date,
        contract_duration=a.contract_duration,
        termination_date=a.termination_date,
        terms=json.loads(a.terms_json) if a.terms_json else None,
        documents=json.loads(a.documents_json) if a.documents_json else None,
        created_by=a.created_by,
        updated_by=a.updated_by,
        created_at=a.created_at,
        updated_at=a.updated_at,
    )


@router.delete("/{agreement_id}")
async def delete_agreement(
    agreement_id: int,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    a = session.get(Agreement, agreement_id)
    if not a or a.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)

    session.delete(a)
    session.commit()
    return {"ok": True}
