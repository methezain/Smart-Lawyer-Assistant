from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from sqlalchemy import delete, func

from ..auth import get_current_user, JWTTokenData
from ..database import engine
from ..models import Invoice, InvoiceItem, Payment
from ..schemas import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceRead,
    InvoiceListResponse,
    PaginationInfo,
    PaymentCreate,
    PaymentRead,
    InvoiceItemRead,
    AgreementLedger,
)

router = APIRouter(prefix="/invoices", tags=["invoices"])

NOT_FOUND = "Invoice not found"


def get_session():
    with Session(engine) as session:
        yield session


def inflate(invoice: Invoice, session: Session) -> InvoiceRead:
    items = session.exec(select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id)).all()
    pays = session.exec(select(Payment).where(Payment.invoice_id == invoice.id)).all()
    return InvoiceRead(
        id=invoice.id,
        firm_id=invoice.firm_id,
        invoice_no=invoice.invoice_no,
        agreement_id=invoice.agreement_id,
        client_name=invoice.client_name,
        contract_title=invoice.contract_title,
        issued_date=invoice.issued_date,
        due_date=invoice.due_date,
        status=invoice.status,
        payment_method=invoice.payment_method,
        notes=invoice.notes,
        total_amount=invoice.total_amount,
        amount_paid=invoice.amount_paid,
        items=[InvoiceItemRead(id=i.id, description=i.description, amount=i.amount) for i in items],
        payments=[PaymentRead(id=p.id, amount=p.amount, method=p.method, reference=p.reference, paid_date=p.paid_date) for p in pays],
        created_by=invoice.created_by,
        updated_by=invoice.updated_by,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
    )


@router.get("/", response_model=InvoiceListResponse)
def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    agreement_id: Optional[int] = Query(None),
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = select(Invoice).where(Invoice.firm_id == current_user.firm_id)
    if search:
        like = f"%{search}%"
        stmt = stmt.where((Invoice.invoice_no.ilike(like)) | (Invoice.client_name.ilike(like)) | (Invoice.contract_title.ilike(like)))
    if status:
        stmt = stmt.where(Invoice.status == status)
    if agreement_id:
        stmt = stmt.where(Invoice.agreement_id == agreement_id)

    results = session.exec(stmt)
    try:
        total = results.count()
    except Exception:
        total = len(results.all())

    stmt_paged = stmt.order_by(Invoice.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = session.exec(stmt_paged).all()

    total_pages = (total + page_size - 1) // page_size
    return InvoiceListResponse(
        invoices=[inflate(x, session) for x in items],
        pagination=PaginationInfo(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )


@router.post("/", response_model=InvoiceRead)
def create_invoice(
    payload: InvoiceCreate,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # generate invoice number if not provided
    invoice_no = payload.invoice_no
    if not invoice_no:
        today = datetime.now(timezone.utc)
        y = str(today.year)[-2:]
        # naive sequence by count+1 for now
        try:
            total_count = session.exec(
                select(func.count()).select_from(Invoice).where(Invoice.firm_id == current_user.firm_id)
            ).one()
            count = int(total_count or 0)
        except Exception:
            count = len(
                session.exec(select(Invoice).where(Invoice.firm_id == current_user.firm_id)).all()
            )
        invoice_no = f"INV-{y}-{str((count or 0) + 1).zfill(3)}"

    inv = Invoice(
        firm_id=current_user.firm_id,
        agreement_id=payload.agreement_id,
        invoice_no=invoice_no,
        client_name=payload.client_name,
        contract_title=payload.contract_title,
        issued_date=payload.issued_date,
        due_date=payload.due_date,
        status=payload.status or "Unpaid",
        payment_method=payload.payment_method,
        notes=payload.notes,
        created_by=current_user.user_id,
        updated_by=current_user.user_id,
    )
    session.add(inv)
    session.commit()
    session.refresh(inv)

    total = 0.0
    for it in payload.items:
        item = InvoiceItem(invoice_id=inv.id, description=it.description, amount=it.amount)
        session.add(item)
        total += float(it.amount)
    inv.total_amount = total
    inv.updated_at = datetime.now(timezone.utc)

    session.add(inv)
    session.commit()
    session.refresh(inv)
    return inflate(inv, session)


@router.get("/{invoice_id}", response_model=InvoiceRead)
def get_invoice(invoice_id: int, current_user: JWTTokenData = Depends(get_current_user), session: Session = Depends(get_session)):
    inv = session.get(Invoice, invoice_id)
    if not inv or inv.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return inflate(inv, session)


@router.patch("/{invoice_id}", response_model=InvoiceRead)
def update_invoice(
    invoice_id: int,
    patch: InvoiceUpdate,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    inv = session.get(Invoice, invoice_id)
    if not inv or inv.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND)

    data = patch.model_dump(exclude_unset=True)
    # items handled separately
    items = data.pop("items", None)
    for k, v in data.items():
        setattr(inv, k, v)
    inv.updated_by = current_user.user_id
    inv.updated_at = datetime.now(timezone.utc)
    session.add(inv)
    session.commit()

    if items is not None:
        # delete old items, insert new
        session.exec(delete(InvoiceItem).where(InvoiceItem.invoice_id == inv.id))
        total = 0.0
        for it in items:
            desc = it["description"] if isinstance(it, dict) else it.description
            amt = it["amount"] if isinstance(it, dict) else it.amount
            session.add(InvoiceItem(invoice_id=inv.id, description=desc, amount=amt))
            total += float(amt) if amt is not None else 0.0
        inv.total_amount = total
        session.add(inv)
        session.commit()

    session.refresh(inv)
    return inflate(inv, session)


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, current_user: JWTTokenData = Depends(get_current_user), session: Session = Depends(get_session)):
    inv = session.get(Invoice, invoice_id)
    if not inv or inv.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    session.exec(delete(InvoiceItem).where(InvoiceItem.invoice_id == inv.id))
    session.exec(delete(Payment).where(Payment.invoice_id == inv.id))
    session.delete(inv)
    session.commit()
    return {"ok": True}


@router.post("/{invoice_id}/payments", response_model=InvoiceRead)
def add_payment(
    invoice_id: int,
    payload: PaymentCreate,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    inv = session.get(Invoice, invoice_id)
    if not inv or inv.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    p = Payment(invoice_id=invoice_id, amount=payload.amount, method=payload.method, reference=payload.reference, paid_date=payload.paid_date)
    session.add(p)
    inv.amount_paid = float(inv.amount_paid or 0) + float(payload.amount or 0)
    if inv.amount_paid >= inv.total_amount and inv.total_amount > 0:
        inv.status = "Paid"
    elif 0 < inv.amount_paid < inv.total_amount:
        inv.status = "Partially Paid"
    inv.updated_at = datetime.now(timezone.utc)
    session.add(inv)
    session.commit()
    session.refresh(inv)
    return inflate(inv, session)


@router.delete("/{invoice_id}/payments/{payment_id}", response_model=InvoiceRead)
def remove_payment(
    invoice_id: int,
    payment_id: int,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    inv = session.get(Invoice, invoice_id)
    if not inv or inv.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    p = session.get(Payment, payment_id)
    if not p or p.invoice_id != inv.id:
        raise HTTPException(status_code=404, detail="Payment not found")
    inv.amount_paid = max(0.0, float(inv.amount_paid or 0) - float(p.amount or 0))
    session.delete(p)
    if inv.amount_paid <= 0:
        inv.status = "Unpaid"
    elif inv.amount_paid < inv.total_amount:
        inv.status = "Partially Paid"
    else:
        inv.status = "Paid"
    inv.updated_at = datetime.now(timezone.utc)
    session.add(inv)
    session.commit()
    session.refresh(inv)
    return inflate(inv, session)


@router.get("/ledger/by-agreement/{agreement_id}", response_model=AgreementLedger)
def agreement_ledger(
    agreement_id: int,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Ensure firm scoping
    invoices = session.exec(
        select(Invoice).where(
            (Invoice.firm_id == current_user.firm_id)
            & (Invoice.agreement_id == agreement_id)
        )
    ).all()
    total_billed = sum(float(inv.total_amount or 0) for inv in invoices)
    total_paid = sum(float(inv.amount_paid or 0) for inv in invoices)
    return AgreementLedger(
        agreement_id=agreement_id,
        invoice_count=len(invoices),
        total_billed=total_billed,
        total_paid=total_paid,
        outstanding=max(0.0, total_billed - total_paid),
    )
