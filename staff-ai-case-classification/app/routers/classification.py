from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas
from ..utils.ocr import extract_text_from_pdf
from ..utils.category_prediction import predict_case_category
from ..utils.classification_service import create_classification, list_classifications

import os
import tempfile
import logging


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload_pdf/", response_model=schemas.ClassificationOut)
async def upload_pdf(
    assigned_lawyer_id: int = Query(..., description="Assigned lawyer ID"),
    firm_id: int = Query(..., description="Firm ID"),
    file: UploadFile = File(...),
    assigned_lawyer_name: str | None = Query(None, description="Assigned lawyer name (optional)"),
    firm_name: str | None = Query(None, description="Firm name (optional)"),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # Save to a temp file and run OCR via utils
    suffix = os.path.splitext(file.filename)[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    try:
        text = extract_text_from_pdf(tmp_path)
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
    if not text:
        # Degrade gracefully: proceed with empty text (predictor will return a fallback)
        text = ""

    # Predict category (fail-safe to avoid breaking the flow)
    try:
        category = predict_case_category(text)
        if not category or not isinstance(category, str):
            category = "Unknown"
    except Exception as e:
        logger.exception("Prediction failed; returning fallback category. %s", e)
        category = "Unknown"

    classification = create_classification(
        db,
        filename=file.filename,
        category=category,
        pdf_text=text,
        assigned_lawyer_id=assigned_lawyer_id,
        firm_id=firm_id,
    assigned_lawyer_name=assigned_lawyer_name,
    firm_name=firm_name,
    )

    return classification


@router.get("/predictions/", response_model=schemas.ClassificationList)
def get_predictions(
    firm_id: int = Query(...),
    assigned_lawyer_id: int | None = Query(None),
    # ClientTable-style pagination support (page/page_size)
    page: int | None = Query(None, ge=1),
    page_size: int | None = Query(None, ge=1, le=200),
    # Retain skip/limit for backwards-compat
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    # If page-based params are provided, they take precedence
    if page is not None:
        eff_size = page_size if page_size is not None else limit
        skip = (page - 1) * eff_size
        limit = eff_size

    items, total = list_classifications(
        db, firm_id=firm_id, lawyer_id=assigned_lawyer_id, skip=skip, limit=limit
    )
    return {"items": items, "total": total}
