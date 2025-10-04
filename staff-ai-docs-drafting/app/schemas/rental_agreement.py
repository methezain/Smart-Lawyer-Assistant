"""Pydantic schemas for API layer referencing SQLModel entities."""
from __future__ import annotations

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LeaseAgreementCreate(BaseModel):
	landlord_name: str
	landlord_address: str
	tenant_name: str
	tenant_address: str
	property_address: str
	lease_start_date: str
	lease_end_date: str
	rent_amount: str
	payment_due_date: str
	payment_method: str
	security_deposit: str
	utilities_maintenance: str
	restrictions: str
	termination_clause: str
	governing_law: str = "Applicable local laws"
	date_of_agreement: Optional[str] = None


class LeaseAgreementRead(LeaseAgreementCreate):
	id: int
	agreement_text: str
	created_at: datetime

	class Config:
		from_attributes = True  # allow ORM mode


class LeaseAgreementGenerateResponse(BaseModel):
	id: int
	agreement_text: str
