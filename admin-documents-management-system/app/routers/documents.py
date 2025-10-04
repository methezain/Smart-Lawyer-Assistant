import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlmodel import Session, select
import aiofiles

from app.auth import get_current_user, JWTTokenData
from app.database import engine
from app.models import Document
from app.schemas import DocumentCreate, DocumentUpdate, DocumentRead, DocumentListResponse, PaginationInfo

UPLOAD_DIR = os.getenv("DOCUMENTS_UPLOAD_DIR", os.path.abspath(os.path.join(os.getcwd(), "uploads", "documents")))
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/documents", tags=["documents"])

NOT_FOUND_MSG = "Document not found"


def get_session():
    with Session(engine) as session:
        yield session

@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    doc_type: Optional[str] = Query(None),
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = select(Document).where(Document.firm_id == current_user.firm_id)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            (Document.title.ilike(like))
            | (Document.description.ilike(like))
            | (Document.case_number.ilike(like))
            | (Document.case_title.ilike(like))
            | (Document.tags.ilike(like))
        )
    if status:
        stmt = stmt.where(Document.status == status)
    if doc_type:
        stmt = stmt.where(Document.doc_type == doc_type)

    # Compute total first without pagination
    results = session.exec(stmt)
    try:
        total = results.count()  # SQLModel 0.0.16+ may support count()
    except Exception:
        all_items = results.all()
        total = len(all_items)
    # Now fetch paged items
    stmt_paged = stmt.order_by(Document.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = session.exec(stmt_paged).all()

    total_pages = (total + page_size - 1) // page_size if page_size else 1
    return DocumentListResponse(
        documents=items,
        pagination=PaginationInfo(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )

@router.post("/", response_model=DocumentRead)
async def create_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    doc_type: Optional[str] = Form(None),
    status: Optional[str] = Form("uploaded"),
    tags: Optional[str] = Form(None),
    case_id: Optional[int] = Form(None),
    case_number: Optional[str] = Form(None),
    case_title: Optional[str] = Form(None),
    client_id: Optional[int] = Form(None),
    client_name: Optional[str] = Form(None),
    assigned_lawyer_id: Optional[int] = Form(None),
    assigned_lawyer_name: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Validate file type (PDF, Word, Excel)
    allowed_mimes = {
        "application/pdf",
        "application/msword",  # .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
        "application/vnd.ms-excel",  # .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
    }
    allowed_exts = {".pdf", ".doc", ".docx", ".xls", ".xlsx"}
    filename_ext = os.path.splitext(file.filename)[1].lower()
    if (file.content_type not in allowed_mimes) and (filename_ext not in allowed_exts):
        raise HTTPException(status_code=400, detail="Only PDF, Word, or Excel documents are allowed")

    # Save file
    ext = filename_ext or os.path.splitext(file.filename)[1]
    safe_name = f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    doc = Document(
        firm_id=current_user.firm_id,
        title=title,
        description=description,
        status=status or "uploaded",
        doc_type=doc_type,
        tags=tags,
        case_id=case_id,
        case_number=case_number,
        case_title=case_title,
    client_id=client_id,
    client_name=client_name,
    assigned_lawyer_id=assigned_lawyer_id,
    assigned_lawyer_name=assigned_lawyer_name,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        uploaded_by=current_user.user_id,
        updated_by=current_user.user_id,
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc

@router.get("/{doc_id}", response_model=DocumentRead)
async def get_document(doc_id: int, current_user: JWTTokenData = Depends(get_current_user), session: Session = Depends(get_session)):
    doc = session.get(Document, doc_id)
    if not doc or doc.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)
    return doc

@router.patch("/{doc_id}", response_model=DocumentRead)
async def update_document(
    doc_id: int,
    data: DocumentUpdate,
    current_user: JWTTokenData = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    doc = session.get(Document, doc_id)
    if not doc or doc.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)

    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(doc, k, v)
    doc.updated_by = current_user.user_id
    doc.updated_at = datetime.now(timezone.utc)
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc

@router.delete("/{doc_id}")
async def delete_document(doc_id: int, current_user: JWTTokenData = Depends(get_current_user), session: Session = Depends(get_session)):
    doc = session.get(Document, doc_id)
    if not doc or doc.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)

    # Delete file from disk if exists
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass

    session.delete(doc)
    session.commit()
    return {"ok": True}

@router.get("/{doc_id}/download")
async def download_document(doc_id: int, current_user: JWTTokenData = Depends(get_current_user), session: Session = Depends(get_session)):
    doc = session.get(Document, doc_id)
    if not doc or doc.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)
    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    filename = os.path.basename(doc.file_path)
    return FileResponse(doc.file_path, media_type=doc.file_type or "application/octet-stream", filename=filename)

@router.get("/{doc_id}/view")
async def view_document(doc_id: int, current_user: JWTTokenData = Depends(get_current_user), session: Session = Depends(get_session)):
    doc = session.get(Document, doc_id)
    if not doc or doc.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MSG)
    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    # No filename forces inline display in most browsers
    return FileResponse(doc.file_path, media_type=doc.file_type or "application/octet-stream")
