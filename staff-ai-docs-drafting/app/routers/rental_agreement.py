from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select

from ..schemas.rental_agreement import (
	LeaseAgreementCreate,
	LeaseAgreementGenerateResponse,
	LeaseAgreementRead,
)
from ..database.rental_agreement import init_db, get_session
from ..models.rental_agreement import RentalAgreement
from ..utils import generate_lease_agreement

router = APIRouter(prefix="/lease_agreements", tags=["lease_agreements"])


@router.on_event("startup")
def _startup():
	init_db()


@router.post("/generate", response_model=LeaseAgreementGenerateResponse)
def create_lease_agreement(
	payload: LeaseAgreementCreate, session: Session = Depends(get_session)
):
	data = payload.model_dump()
	agreement_text = generate_lease_agreement(data)

	agreement = RentalAgreement(
		**data,
		agreement_text=agreement_text,
		created_at=datetime.utcnow(),
	)
	try:
		session.add(agreement)
		session.commit()
		session.refresh(agreement)
	except Exception as e:  # uniqueness or db error
		session.rollback()
		raise HTTPException(status_code=400, detail=f"Could not store agreement: {e}")
	return LeaseAgreementGenerateResponse(id=agreement.id, agreement_text=agreement_text)


@router.get("/{property_address}", response_model=LeaseAgreementRead)
def get_lease_agreement(
	property_address: str, session: Session = Depends(get_session)
):
	stmt = select(RentalAgreement).where(
		RentalAgreement.property_address == property_address
	)
	agreement = session.exec(stmt).first()
	if not agreement:
		raise HTTPException(status_code=404, detail="Lease agreement not found")
	return agreement


@router.delete("/{property_address}")
def delete_lease_agreement(
	property_address: str, session: Session = Depends(get_session)
):
	stmt = select(RentalAgreement).where(
		RentalAgreement.property_address == property_address
	)
	agreement = session.exec(stmt).first()
	if not agreement:
		raise HTTPException(status_code=404, detail="Lease agreement not found")
	session.delete(agreement)
	session.commit()
	return {"message": "Lease agreement deleted successfully"}
