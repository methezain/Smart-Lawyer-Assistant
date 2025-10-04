from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, Query
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import tempfile
import json
from uuid import uuid4
import aiofiles

from app.database import get_session
from app.schemas import ResponseBase, JudgmentOCRResponse, JudgmentCreate, JudgmentRead, JudgmentResponse, JudgmentListResponse, JudgmentUpdate
from app.models import Judgment
from app.utils.ocr import perform_OCR
from app.utils.json_creation import generate_JSON
from datetime import datetime as dt
from app.auth import get_current_user, JWTTokenData

router = APIRouter(prefix="/judgments", tags=["judgments"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "judgments"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Temporary auth/context stub. Replace with real auth dependency.
class RequestContext:
    def __init__(self, firm_id: int, user_id: int):
        self.firm_id = firm_id
        self.user_id = user_id


def get_request_context(user: JWTTokenData = Depends(get_current_user)) -> RequestContext:
    return RequestContext(firm_id=user.firm_id, user_id=user.user_id)


def _model_to_read(j: Judgment) -> JudgmentRead:
    key_points_list: Optional[List[str]] = (
        [kp for kp in (j.key_points or "").split("\n") if kp.strip()]
        if j.key_points
        else None
    )
    return JudgmentRead(
        id=j.id,
        case_id=j.case_id,
    client_id=j.client_id,
    client_name=j.client_name,
    assigned_lawyer_id=j.assigned_lawyer_id,
    assigned_lawyer_name=j.assigned_lawyer_name,
    case_number=j.case_number,
    case_title=j.case_title,
        status=j.status,
    court=j.court,
    judge_name=j.judge_name,
    status_details=j.status_details,
        judgment_date=j.judgment_date,
        summary=j.summary,
        key_points=key_points_list,
        remarks=j.remarks,
        pdf_path=j.pdf_path,
    )

@router.post("/ocr", response_model=JudgmentOCRResponse)
async def ocr_judgment_pdf(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    ctx: RequestContext = Depends(get_request_context),
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Save temp then OCR (async-friendly)
    temp_path = os.path.join(tempfile.gettempdir(), f"judgment_{uuid4().hex}.pdf")
    content = await file.read()
    async with aiofiles.open(temp_path, "wb") as tmp:
        await tmp.write(content)

    try:
        text = perform_OCR(temp_path)
        if not text:
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")
        extracted = generate_JSON(text) or {}

        def _pick(d: Dict[str, Any], candidates: List[str], default: Any = ""):
            for k in candidates:
                v = d.get(k)
                if v is not None and str(v).strip() != "":
                    return v
            return default
        # normalize date to ISO yyyy-mm-dd for the frontend date input
        raw_date = (extracted.get("Judgement Date", "") or "").strip()
        iso_date = raw_date
        for fmt in ("%d.%m.%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
            try:
                iso_date = dt.strptime(raw_date, fmt).date().isoformat()
                break
            except Exception:
                continue
        # normalize keys (fallback to empty)
        status_val = _pick(extracted, [
            "Judgement Status", "Judgment Status", "Status", "Outcome", "Disposition", "Result"
        ], default="")
        status_details_val = _pick(extracted, [
            "Status Details", "Status Detail", "StatusReason", "Rationale", "Remarks"
        ], default="")
        data = {
            "Court Name": _pick(extracted, ["Court Name", "Court"], default=""),
            "Judge Name": _pick(extracted, ["Judge Name", "Bench", "Judge"], default=""),
            "Judgement Date": iso_date,
            "Judgement Summary": _pick(extracted, ["Judgement Summary", "Judgment Summary", "Summary"], default=""),
            "Key Points": extracted.get("Key Points", []),
            "Judgement Status": status_val,
            "Status Details": status_details_val,
        }
        return JudgmentOCRResponse(success=True, message="OCR processed", data=data)
    finally:
        try:
            os.unlink(temp_path)
        except Exception:
            pass


@router.get("", response_model=JudgmentListResponse)
def list_judgments(
    session: Session = Depends(get_session),
    ctx: RequestContext = Depends(get_request_context),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=200),
    page_size: Optional[int] = Query(None, ge=1, le=200),
    search: Optional[str] = Query(None),
):
    """
    List judgments with pagination.
    - Accepts both `size` and `page_size` (page_size takes precedence if provided).
    - Returns extended pagination metadata to mirror other services.
    """
    effective_size = page_size or size

    query = select(Judgment).where(Judgment.firm_id == ctx.firm_id)
    if search:
        like = f"%{search}%"
        query = query.where(
            (Judgment.court.ilike(like))
            | (Judgment.judge_name.ilike(like))
            | (Judgment.summary.ilike(like))
            | (Judgment.case_number.ilike(like))
            | (Judgment.case_title.ilike(like))
        )

    # Count total (simple approach for SQLite/SQLModel)
    total_items = len(session.exec(query).all())

    # Page bounds and items
    offset = (page - 1) * effective_size
    items = session.exec(query.offset(offset).limit(effective_size)).all()

    # Pagination metadata
    total_pages = (total_items + effective_size - 1) // effective_size if effective_size else 0
    has_next = page < total_pages
    has_previous = page > 1 and total_pages > 0

    data = {
        # Core payload
        "items": [_model_to_read(j) for j in items],
        # Back-compat fields
        "total": total_items,
        "page": page,
        "size": effective_size,
        # Extended pagination (align with Cases service)
        "total_items": total_items,
        "page_size": effective_size,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_previous": has_previous,
    }
    return JudgmentListResponse(success=True, message="OK", data=data)


@router.get("/{judgment_id}", response_model=JudgmentResponse)
def get_judgment(judgment_id: int, session: Session = Depends(get_session), ctx: RequestContext = Depends(get_request_context)):
    j = session.get(Judgment, judgment_id)
    if not j or j.firm_id != ctx.firm_id:
        raise HTTPException(status_code=404, detail="Judgment not found")
    return JudgmentResponse(success=True, message="OK", data=_model_to_read(j))


@router.post("", response_model=JudgmentResponse)
async def create_judgment(
    session: Session = Depends(get_session),
    ctx: RequestContext = Depends(get_request_context),
    # Accept a JSON string of the form data and an optional file in multipart
    data: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    try:
        payload: Dict[str, Any] = json.loads(data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid data payload")

    try:
        # Accept flexible date formats in payload
        jd = payload.get("judgment_date")
        if isinstance(jd, str):
            s = jd.strip()
            for fmt in ("%d.%m.%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
                try:
                    payload["judgment_date"] = dt.strptime(s, fmt).date().isoformat()
                    break
                except Exception:
                    continue
        create = JudgmentCreate(**payload)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid fields: {e}")

    # Enforce no duplicate judgment for the same case in the same firm
    exists_stmt = select(Judgment).where(
        Judgment.firm_id == ctx.firm_id,
        Judgment.case_id == create.case_id,
    )
    existing = session.exec(exists_stmt).first()
    if existing:
        raise HTTPException(status_code=400, detail="A judgment for this case already exists")

    # Convert key_points list -> newline string
    key_points_str: Optional[str] = None
    if create.key_points:
        key_points_str = "\n".join([s.strip() for s in create.key_points if s and s.strip()])

    j = Judgment(
        firm_id=ctx.firm_id,
        case_id=create.case_id,
    client_id=create.client_id,
    client_name=create.client_name,
    assigned_lawyer_id=create.assigned_lawyer_id,
    assigned_lawyer_name=create.assigned_lawyer_name,
    case_number=create.case_number,
    case_title=create.case_title,
    status=create.status or "",
    court=create.court,
    judge_name=create.judge_name,
    status_details=create.status_details,
        judgment_date=create.judgment_date,
        summary=create.summary,
        key_points=key_points_str,
        remarks=create.remarks,
    created_at=datetime.now(),  # Avoid using utcnow()
        created_by=ctx.user_id,
    )
    # Derive a simple one-word status if missing
    if not j.status:
        text_blob = " ".join(filter(None, [j.summary or "", j.remarks or "", (j.key_points or "").replace("\n", " ")]))
        tb = text_blob.lower()
        derived = ""
        if any(k in tb for k in ["appeal allowed", "allowed", "granted", "relief granted", "petition accepted", "petition allowed"]):
            derived = "Allowed"
        elif any(k in tb for k in ["dismissed", "rejected", "denied", "no relief"]):
            derived = "Dismissed"
        elif any(k in tb for k in ["partly allowed", "partially allowed", "partially granted", "partly granted"]):
            derived = "PartlyAllowed"
        elif any(k in tb for k in ["remand", "remanded"]):
            derived = "Remanded"
        elif any(k in tb for k in ["withdrawn"]):
            derived = "Withdrawn"
        j.status = derived

    session.add(j)
    session.commit()
    session.refresh(j)

    # Save uploaded PDF if provided
    if file and file.filename:
        firm_dir = os.path.join(UPLOAD_DIR, str(ctx.firm_id), str(j.id))
        os.makedirs(firm_dir, exist_ok=True)
        filename = os.path.basename(file.filename)
        safe_name = filename.replace("..", "").replace("/", "_").replace("\\", "_")
        pdf_path = os.path.join(firm_dir, safe_name)
        # Write file asynchronously
        file_bytes = await file.read()
        async with aiofiles.open(pdf_path, "wb") as f:
            await f.write(file_bytes)
        # Store relative path
        j.pdf_path = os.path.relpath(pdf_path, start=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
        session.add(j)
        session.commit()
        session.refresh(j)

    return JudgmentResponse(success=True, message="Created", data=_model_to_read(j))


def _parse_date_flex(value: str) -> Optional[str]:
    if not value:
        return None
    s = value.strip()
    for fmt in ("%d.%m.%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return dt.strptime(s, fmt).date().isoformat()
        except Exception:
            continue
    return None


@router.patch("/{judgment_id}", response_model=JudgmentResponse)
async def update_judgment(
    judgment_id: int,
    session: Session = Depends(get_session),
    ctx: RequestContext = Depends(get_request_context),
    data: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    j = session.get(Judgment, judgment_id)
    if not j or j.firm_id != ctx.firm_id:
        raise HTTPException(status_code=404, detail="Judgment not found")

    payload: Dict[str, Any] = {}
    if data:
        try:
            payload = json.loads(data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid data payload")

    # Apply field updates if present
    if "case_id" in payload and payload["case_id"] is not None:
        new_case_id = int(payload["case_id"])  # type: ignore
        # If changing case, enforce uniqueness within firm
        if new_case_id != j.case_id:
            exists_stmt = select(Judgment).where(
                Judgment.firm_id == ctx.firm_id,
                Judgment.case_id == new_case_id,
                Judgment.id != j.id,
            )
            existing = session.exec(exists_stmt).first()
            if existing:
                raise HTTPException(status_code=400, detail="A judgment for this case already exists")
            j.case_id = new_case_id
    if "status" in payload and payload["status"] is not None:
        j.status = str(payload["status"])  # type: ignore
    if "client_id" in payload:
        j.client_id = int(payload["client_id"]) if payload["client_id"] is not None else None
    if "client_name" in payload:
        j.client_name = payload.get("client_name")
    if "assigned_lawyer_id" in payload:
        j.assigned_lawyer_id = int(payload["assigned_lawyer_id"]) if payload["assigned_lawyer_id"] is not None else None
    if "assigned_lawyer_name" in payload:
        j.assigned_lawyer_name = payload.get("assigned_lawyer_name")
    if "case_number" in payload:
        j.case_number = payload.get("case_number")
    if "case_title" in payload:
        j.case_title = payload.get("case_title")
    if "status_details" in payload:
        j.status_details = payload.get("status_details")
    if "court" in payload and payload["court"] is not None:
        j.court = str(payload["court"])  # type: ignore
    if "judge_name" in payload and payload["judge_name"] is not None:
        j.judge_name = str(payload["judge_name"])  # type: ignore
    if "judgment_date" in payload and payload["judgment_date"]:
        parsed = _parse_date_flex(str(payload["judgment_date"]))
        if parsed:
            j.judgment_date = dt.strptime(parsed, "%Y-%m-%d").date()
    if "summary" in payload:
        j.summary = payload.get("summary")
    if "key_points" in payload and payload["key_points"] is not None:
        # Expect list, convert to newline string
        kp_list = payload["key_points"] or []
        if isinstance(kp_list, list):
            j.key_points = "\n".join([str(s).strip() for s in kp_list if str(s).strip()])
    if "remarks" in payload:
        j.remarks = payload.get("remarks")

    # Handle file replacement
    if file and file.filename:
        firm_dir = os.path.join(UPLOAD_DIR, str(ctx.firm_id), str(j.id))
        os.makedirs(firm_dir, exist_ok=True)
        filename = os.path.basename(file.filename)
        safe_name = filename.replace("..", "").replace("/", "_").replace("\\", "_")
        pdf_path = os.path.join(firm_dir, safe_name)
        file_bytes = await file.read()
        async with aiofiles.open(pdf_path, "wb") as f:
            await f.write(file_bytes)
        j.pdf_path = os.path.relpath(
            pdf_path,
            start=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")),
        )

    j.updated_at = datetime.now()
    j.updated_by = ctx.user_id
    session.add(j)
    session.commit()
    session.refresh(j)
    return JudgmentResponse(success=True, message="Updated", data=_model_to_read(j))


@router.delete("/{judgment_id}", response_model=ResponseBase)
def delete_judgment(
    judgment_id: int,
    session: Session = Depends(get_session),
    ctx: RequestContext = Depends(get_request_context),
):
    j = session.get(Judgment, judgment_id)
    if not j or j.firm_id != ctx.firm_id:
        raise HTTPException(status_code=404, detail="Judgment not found")

    # Optionally remove files on disk
    if j.pdf_path:
        abs_base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        abs_path = os.path.abspath(os.path.join(abs_base, j.pdf_path))
        try:
            if os.path.isfile(abs_path):
                os.remove(abs_path)
        except Exception:
            pass

    session.delete(j)
    session.commit()
    return ResponseBase(success=True, message="Deleted", data=None)


def _resolve_pdf_abs_path(j: Judgment) -> Optional[str]:
    if not j.pdf_path:
        return None
    abs_base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    abs_path = os.path.abspath(os.path.join(abs_base, j.pdf_path))
    if not os.path.isfile(abs_path):
        return None
    return abs_path


@router.get("/{judgment_id}/file/view")
def view_pdf(
    judgment_id: int,
    session: Session = Depends(get_session),
    ctx: RequestContext = Depends(get_request_context),
):
    j = session.get(Judgment, judgment_id)
    if not j or j.firm_id != ctx.firm_id:
        raise HTTPException(status_code=404, detail="Judgment not found")
    abs_path = _resolve_pdf_abs_path(j)
    if not abs_path:
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(abs_path, media_type="application/pdf")


@router.get("/{judgment_id}/file/download")
def download_pdf(
    judgment_id: int,
    session: Session = Depends(get_session),
    ctx: RequestContext = Depends(get_request_context),
):
    j = session.get(Judgment, judgment_id)
    if not j or j.firm_id != ctx.firm_id:
        raise HTTPException(status_code=404, detail="Judgment not found")
    abs_path = _resolve_pdf_abs_path(j)
    if not abs_path:
        raise HTTPException(status_code=404, detail="PDF not found")
    filename = os.path.basename(abs_path)
    return FileResponse(
        abs_path,
        media_type="application/pdf",
        filename=filename,
    )
