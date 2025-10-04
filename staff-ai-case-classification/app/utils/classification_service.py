from __future__ import annotations

from sqlalchemy.orm import Session

from .. import models


def create_classification(
    db: Session,
    *,
    filename: str,
    category: str,
    pdf_text: str | None,
    assigned_lawyer_id: int,
    firm_id: int,
    assigned_lawyer_name: str | None = None,
    firm_name: str | None = None,
) -> models.Classification:
    classification = models.Classification(
        filename=filename,
        category=category,
        pdf_text=pdf_text,
        assigned_lawyer_id=assigned_lawyer_id,
        firm_id=firm_id,
        assigned_lawyer_name=assigned_lawyer_name,
        firm_name=firm_name,
    )
    db.add(classification)
    db.commit()
    db.refresh(classification)
    return classification


def list_classifications(db: Session, *, firm_id: int, lawyer_id: int | None = None, skip: int = 0, limit: int = 50):
    q = db.query(models.Classification).filter(models.Classification.firm_id == firm_id)
    if lawyer_id is not None:
        q = q.filter(models.Classification.assigned_lawyer_id == lawyer_id)
    total = q.count()
    items = q.order_by(models.Classification.created_at.desc()).offset(skip).limit(limit).all()
    return items, total
