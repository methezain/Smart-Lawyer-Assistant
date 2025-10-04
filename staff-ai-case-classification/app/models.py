from __future__ import annotations

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from .database import Base

class Classification(Base):
    __tablename__ = "classifications"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(512), nullable=False)
    category = Column(String(255), nullable=False)
    pdf_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Flattened firm and lawyer info into a single table
    assigned_lawyer_id = Column(Integer, nullable=False, index=True)
    assigned_lawyer_name = Column(String(255), nullable=True)
    firm_id = Column(Integer, nullable=False, index=True)
    firm_name = Column(String(255), nullable=True)
