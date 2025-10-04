from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Agreement(SQLModel, table=True):
    __tablename__ = "agreements"

    id: Optional[int] = Field(default=None, primary_key=True)
    firm_id: int = Field(index=True)

    title: str = Field(index=True)
    case_type: Optional[str] = Field(default=None, index=True)
    status: Optional[str] = Field(default="Pending Signature", index=True)

    client: Optional[str] = Field(default=None, index=True)
    client_cnic: Optional[str] = Field(default=None, index=True)
    client_address: Optional[str] = Field(default=None)
    law_firm: Optional[str] = Field(default=None, index=True)

    amount: Optional[float] = Field(default=None)
    currency: Optional[str] = Field(default="PKR")

    contract_content: Optional[str] = Field(default=None)

    filed_date: Optional[datetime] = Field(default=None, index=True)
    expected_file_date: Optional[datetime] = Field(default=None)
    effective_date: Optional[datetime] = Field(default=None)
    contract_duration: Optional[int] = Field(default=None, description="Months")
    termination_date: Optional[datetime] = Field(default=None, index=True)

    # JSON-encoded arrays (terms, documents) stored as text for SQLite simplicity
    terms_json: Optional[str] = Field(default=None, description="JSON list of terms")
    documents_json: Optional[str] = Field(default=None, description="JSON list of {name,url}")

    created_by: Optional[int] = Field(default=None, index=True)
    updated_by: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})
