from __future__ import annotations

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class RentalAgreementBase(SQLModel):
    landlord_name: str = Field(index=True)
    landlord_address: str
    tenant_name: str = Field(index=True)
    tenant_address: str
    property_address: str = Field(unique=True, index=True)
    lease_start_date: str
    lease_end_date: str
    rent_amount: str
    payment_due_date: str
    payment_method: str
    security_deposit: str
    utilities_maintenance: str
    restrictions: str
    termination_clause: str
    governing_law: str = Field(default="Applicable local laws")
    date_of_agreement: Optional[str] = None
    agreement_text: Optional[str] = None


class RentalAgreement(RentalAgreementBase, table=True):
    __tablename__ = "lease_agreements"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RentalAgreementCreate(RentalAgreementBase):
    pass


class RentalAgreementRead(RentalAgreementBase):
    id: int
    created_at: datetime


class RentalAgreementDeleteResponse(SQLModel):
    message: str
