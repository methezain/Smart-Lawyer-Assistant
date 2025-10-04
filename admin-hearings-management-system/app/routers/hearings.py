from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import FileResponse
import os
from sqlmodel import Session, select, or_, and_
from typing import List, Optional
from datetime import date, datetime, time

from app.database import get_session
from app.models import Hearing, HearingStatus, HearingAttachment
from app.schemas import (
    HearingCreate, HearingUpdate, HearingResponse, HearingListResponse,
    PaginationParams, HearingFilters, ResponseBase, HearingSortEnum,
    NotFoundResponse, ValidationErrorResponse, HearingStatistics,
    UpcomingHearing, HearingCalendarEvent,
    HearingAttachmentRead, HearingAttachmentListResponse, AttachmentUploadResponse, AttachmentCountResponse
)
from app.utils import (
    calculate_pagination, validate_hearing_data,
    parse_required_documents, format_required_documents
)
from app.auth import get_current_user, get_user_firm_filter, JWTTokenData

router = APIRouter(prefix="/hearings", tags=["hearings"])


@router.get("/", response_model=HearingListResponse)
async def get_hearings(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search in case title, case number, court name, or judge name"),
    status: Optional[HearingStatus] = Query(None, description="Filter by hearing status"),
    hearing_type: Optional[str] = Query(None, description="Filter by hearing type"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    assigned_lawyer_id: Optional[int] = Query(None, description="Filter by assigned lawyer"),
    hearing_date_from: Optional[date] = Query(None, description="Filter hearings from this date"),
    hearing_date_to: Optional[date] = Query(None, description="Filter hearings to this date"),
    court_name: Optional[str] = Query(None, description="Filter by court name"),
    judge_name: Optional[str] = Query(None, description="Filter by judge name"),
    sort_by: HearingSortEnum = Query(HearingSortEnum.DATE_ASC, description="Sort hearings by"),
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get a paginated list of hearings with filtering and sorting options. Only returns hearings for the authenticated user's firm."""
    
    # Build base query with firm filtering
    statement = select(Hearing).where(Hearing.firm_id == current_user.firm_id)
    
    # Apply search filter
    if search:
        search_filter = or_(
            Hearing.case_title.ilike(f"%{search}%"),
            Hearing.case_number.ilike(f"%{search}%"),
            Hearing.court_name.ilike(f"%{search}%"),
            Hearing.judge_name.ilike(f"%{search}%"),
            Hearing.assigned_lawyer_name.ilike(f"%{search}%")
        )
        statement = statement.where(search_filter)
    
    # Apply filters
    if status:
        statement = statement.where(Hearing.status == status)
    
    if hearing_type:
        statement = statement.where(Hearing.hearing_type.ilike(f"%{hearing_type}%"))
    
    if case_id:
        statement = statement.where(Hearing.case_id == case_id)
    
    if assigned_lawyer_id:
        statement = statement.where(Hearing.assigned_lawyer_id == assigned_lawyer_id)
    
    if hearing_date_from:
        statement = statement.where(Hearing.hearing_date >= hearing_date_from)
    
    if hearing_date_to:
        statement = statement.where(Hearing.hearing_date <= hearing_date_to)
    
    if court_name:
        statement = statement.where(Hearing.court_name.ilike(f"%{court_name}%"))
    
    if judge_name:
        statement = statement.where(Hearing.judge_name.ilike(f"%{judge_name}%"))
    
    # Apply sorting
    if sort_by == HearingSortEnum.LATEST:
        statement = statement.order_by(Hearing.created_at.desc())
    elif sort_by == HearingSortEnum.OLDEST:
        statement = statement.order_by(Hearing.created_at.asc())
    elif sort_by == HearingSortEnum.DATE_ASC:
        statement = statement.order_by(Hearing.hearing_date.asc(), Hearing.hearing_time.asc())
    elif sort_by == HearingSortEnum.DATE_DESC:
        statement = statement.order_by(Hearing.hearing_date.desc(), Hearing.hearing_time.desc())
    elif sort_by == HearingSortEnum.COURT:
        statement = statement.order_by(Hearing.court_name.asc())
    elif sort_by == HearingSortEnum.STATUS:
        statement = statement.order_by(Hearing.status.asc())
    elif sort_by == HearingSortEnum.TYPE:
        statement = statement.order_by(Hearing.hearing_type.asc())
    
    # Get total count for pagination
    total_count = len(session.exec(statement).all())
    
    # Apply pagination
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    
    # Execute query
    hearings = session.exec(statement).all()
    
    # Calculate pagination
    pagination = calculate_pagination(page, page_size, total_count)
    
    return HearingListResponse(
        success=True,
        message=f"Retrieved {len(hearings)} hearings",
        data={
            "hearings": hearings,
            "pagination": pagination.dict()
        }
    )


@router.post("/", response_model=HearingResponse, status_code=status.HTTP_201_CREATED)
async def create_hearing(
    hearing_data: HearingCreate,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Create a new hearing for the authenticated user's firm."""
    
    # Validate hearing data
    validation_errors = validate_hearing_data(hearing_data.dict())
    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation errors: {', '.join(validation_errors)}"
        )
    
    # Create hearing with firm association
    hearing = Hearing(
        **hearing_data.dict(),
        firm_id=current_user.firm_id,
        created_by=current_user.user_id,
        created_at=datetime.utcnow()
    )
    
    session.add(hearing)
    session.commit()
    session.refresh(hearing)
    
    return HearingResponse(
        success=True,
        message="Hearing created successfully",
        data=hearing
    )


# -------------------- Attachments Endpoints (list/count/upload/download/delete) --------------------

ATTACH_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "hearings"))
os.makedirs(ATTACH_BASE_DIR, exist_ok=True)


@router.get("/{hearing_id}/attachments", response_model=HearingAttachmentListResponse)
async def list_hearing_attachments(
    hearing_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    # Ensure hearing belongs to firm
    hearing = session.exec(select(Hearing).where(Hearing.id == hearing_id, Hearing.firm_id == current_user.firm_id)).first()
    if not hearing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hearing not found")

    rows = session.exec(
        select(HearingAttachment)
        .where(
            HearingAttachment.hearing_id == hearing_id,
            HearingAttachment.firm_id == current_user.firm_id,
        )
        .order_by(HearingAttachment.uploaded_at.desc())
    ).all()

    # Convert SQLModel rows to Pydantic models explicitly to avoid serialization issues
    items = [HearingAttachmentRead.model_validate(r) for r in rows]
    return HearingAttachmentListResponse(
        success=True, message=f"Found {len(items)} attachments", data=items
    )


@router.get("/{hearing_id}/attachments/count", response_model=AttachmentCountResponse)
async def count_hearing_attachments(
    hearing_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    hearing = session.exec(select(Hearing).where(Hearing.id == hearing_id, Hearing.firm_id == current_user.firm_id)).first()
    if not hearing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hearing not found")

    from sqlmodel import func
    count = session.exec(select(func.count(HearingAttachment.id)).where(HearingAttachment.hearing_id == hearing_id, HearingAttachment.firm_id == current_user.firm_id)).first() or 0
    return AttachmentCountResponse(success=True, message="Attachment count", data=count)


@router.post("/{hearing_id}/attachments", response_model=AttachmentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_hearing_attachment(
    hearing_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    # Validate hearing
    hearing = session.exec(select(Hearing).where(Hearing.id == hearing_id, Hearing.firm_id == current_user.firm_id)).first()
    if not hearing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hearing not found")

    # Basic file validation (allow common document/image types)
    allowed_exts = {"pdf", "doc", "docx", "png", "jpg", "jpeg"}
    original_name = file.filename or "upload"
    ext = original_name.split(".")[-1].lower() if "." in original_name else ""
    if ext not in allowed_exts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    # Save to disk in firm/hearing subfolders
    import uuid
    hearing_dir = os.path.join(ATTACH_BASE_DIR, str(current_user.firm_id), str(hearing_id))
    os.makedirs(hearing_dir, exist_ok=True)
    stored_filename = f"{uuid.uuid4().hex}.{ext}"
    abs_path = os.path.join(hearing_dir, stored_filename)

    content = await file.read()
    with open(abs_path, "wb") as f:
        f.write(content)

    rel_path = os.path.relpath(abs_path, start=os.path.join(os.path.dirname(__file__), "..", ".."))

    # Persist row
    att = HearingAttachment(
        hearing_id=hearing_id,
        firm_id=current_user.firm_id,
        original_filename=original_name,
        stored_filename=stored_filename,
        file_path=rel_path.replace("\\", "/"),
        file_type=file.content_type or ext,
        file_size=len(content),
        uploaded_by=current_user.user_id,
    )
    session.add(att)
    session.commit()
    session.refresh(att)

    # Return validated model to ensure proper JSON serialization
    return AttachmentUploadResponse(
        success=True,
        message="File uploaded",
        data=HearingAttachmentRead.model_validate(att),
    )


@router.get("/{hearing_id}/attachments/{attachment_id}/download")
async def download_hearing_attachment(
    hearing_id: int,
    attachment_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    att = session.get(HearingAttachment, attachment_id)
    if not att or att.hearing_id != hearing_id or att.firm_id != current_user.firm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    abs_base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    abs_path = os.path.join(abs_base, att.file_path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    return FileResponse(abs_path, filename=att.original_filename, media_type="application/octet-stream")


@router.get("/{hearing_id}/attachments/{attachment_id}/view")
async def view_hearing_attachment(
    hearing_id: int,
    attachment_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    att = session.get(HearingAttachment, attachment_id)
    if not att or att.hearing_id != hearing_id or att.firm_id != current_user.firm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    abs_base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    abs_path = os.path.join(abs_base, att.file_path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # For inline viewing, don't set filename to avoid forced download and use correct media type
    media_type = att.file_type or "application/octet-stream"
    return FileResponse(abs_path, media_type=media_type)

@router.delete("/{hearing_id}/attachments/{attachment_id}", response_model=ResponseBase)
async def delete_hearing_attachment(
    hearing_id: int,
    attachment_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    att = session.get(HearingAttachment, attachment_id)
    if not att or att.hearing_id != hearing_id or att.firm_id != current_user.firm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    # Delete file from disk
    abs_base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    abs_path = os.path.join(abs_base, att.file_path)
    if os.path.exists(abs_path):
        try:
            os.remove(abs_path)
        except Exception:
            pass

    session.delete(att)
    session.commit()

    return ResponseBase(success=True, message="Attachment deleted", data=None)

@router.get("/statistics", response_model=ResponseBase)
async def get_hearing_statistics(
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get hearing statistics for the authenticated user's firm."""
    
    from datetime import datetime, timedelta
    from sqlmodel import func
    
    # Get current date and time ranges
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    month_start = today.replace(day=1)
    next_month = month_start.replace(month=month_start.month + 1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1)
    month_end = next_month - timedelta(days=1)
    
    # Base query for firm's hearings
    base_query = select(Hearing).where(Hearing.firm_id == current_user.firm_id)
    
    # Total hearings
    total_hearings = session.exec(select(func.count(Hearing.id)).where(Hearing.firm_id == current_user.firm_id)).first()
    
    # Hearings by status
    scheduled_hearings = session.exec(select(func.count(Hearing.id)).where(
        Hearing.firm_id == current_user.firm_id, Hearing.status == HearingStatus.SCHEDULED
    )).first()
    
    completed_hearings = session.exec(select(func.count(Hearing.id)).where(
        Hearing.firm_id == current_user.firm_id, Hearing.status == HearingStatus.COMPLETED
    )).first()
    
    postponed_hearings = session.exec(select(func.count(Hearing.id)).where(
        Hearing.firm_id == current_user.firm_id, Hearing.status == HearingStatus.POSTPONED
    )).first()
    
    cancelled_hearings = session.exec(select(func.count(Hearing.id)).where(
        Hearing.firm_id == current_user.firm_id, Hearing.status == HearingStatus.CANCELLED
    )).first()
    
    # Upcoming hearings
    upcoming_this_week = session.exec(select(func.count(Hearing.id)).where(
        Hearing.firm_id == current_user.firm_id,
        Hearing.hearing_date >= week_start,
        Hearing.hearing_date <= week_end,
        Hearing.status == HearingStatus.SCHEDULED
    )).first()
    
    upcoming_this_month = session.exec(select(func.count(Hearing.id)).where(
        Hearing.firm_id == current_user.firm_id,
        Hearing.hearing_date >= month_start,
        Hearing.hearing_date <= month_end,
        Hearing.status == HearingStatus.SCHEDULED
    )).first()
    
    # Hearings by type
    hearing_types_query = session.exec(select(Hearing.hearing_type, func.count(Hearing.id)).where(
        Hearing.firm_id == current_user.firm_id
    ).group_by(Hearing.hearing_type)).all()
    by_type = {hearing_type: count for hearing_type, count in hearing_types_query}
    
    # Hearings by court
    courts_query = session.exec(select(Hearing.court_name, func.count(Hearing.id)).where(
        Hearing.firm_id == current_user.firm_id
    ).group_by(Hearing.court_name)).all()
    by_court = {court: count for court, count in courts_query}
    
    # Hearings by month (last 12 months)
    by_month = {}
    for i in range(12):
        month_date = today - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")
        month_start_date = month_date.replace(day=1)
        if month_date.month == 12:
            month_end_date = month_date.replace(year=month_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end_date = month_date.replace(month=month_date.month + 1, day=1) - timedelta(days=1)
        
        count = session.exec(select(func.count(Hearing.id)).where(
            Hearing.firm_id == current_user.firm_id,
            Hearing.hearing_date >= month_start_date,
            Hearing.hearing_date <= month_end_date
        )).first()
        by_month[month_key] = count or 0
    
    statistics = HearingStatistics(
        total_hearings=total_hearings or 0,
        scheduled_hearings=scheduled_hearings or 0,
        completed_hearings=completed_hearings or 0,
        postponed_hearings=postponed_hearings or 0,
        cancelled_hearings=cancelled_hearings or 0,
        upcoming_this_week=upcoming_this_week or 0,
        upcoming_this_month=upcoming_this_month or 0,
        by_type=by_type,
        by_court=by_court,
        by_month=by_month
    )
    
    return ResponseBase(
        success=True,
        message="Hearing statistics retrieved successfully",
        data=statistics.dict()
    )


@router.get("/upcoming", response_model=ResponseBase)
async def get_upcoming_hearings_summary(
    limit: int = Query(5, ge=1, le=20, description="Number of upcoming hearings to return"),
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get upcoming hearings summary for dashboard."""
    
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    
    hearings = session.exec(
        select(Hearing).where(
            Hearing.firm_id == current_user.firm_id,
            Hearing.hearing_date >= today,
            Hearing.status == HearingStatus.SCHEDULED
        ).order_by(Hearing.hearing_date.asc(), Hearing.hearing_time.asc()).limit(limit)
    ).all()
    
    upcoming_hearings = []
    for hearing in hearings:
        days_until = (hearing.hearing_date - today).days
        upcoming_hearings.append(UpcomingHearing(
            id=hearing.id,
            case_number=hearing.case_number,
            case_title=hearing.case_title,
            hearing_date=hearing.hearing_date,
            hearing_time=hearing.hearing_time,
            court_name=hearing.court_name,
            hearing_type=hearing.hearing_type,
            days_until=days_until
        ))
    
    return ResponseBase(
        success=True,
        message=f"Retrieved {len(upcoming_hearings)} upcoming hearings",
        data=upcoming_hearings
    )


@router.get("/types/list", response_model=ResponseBase)
async def get_hearing_types(
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get list of hearing types used in the firm."""
    
    # Get unique hearing types from firm's hearings
    hearing_types = session.exec(
        select(Hearing.hearing_type).where(
            Hearing.firm_id == current_user.firm_id
        ).distinct()
    ).all()
    
    # Also include default types
    from app.models import HearingType
    default_types = [ht.value for ht in HearingType]
    
    # Combine and deduplicate
    all_types = list(set(hearing_types + default_types))
    all_types.sort()
    
    return ResponseBase(
        success=True,
        message="Hearing types retrieved successfully",
        data=all_types
    )


@router.get("/{hearing_id}", response_model=HearingResponse)
async def get_hearing(
    hearing_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get a specific hearing by ID. Only returns hearings for the authenticated user's firm."""
    
    hearing = session.exec(
        select(Hearing).where(
            Hearing.id == hearing_id,
            Hearing.firm_id == current_user.firm_id
        )
    ).first()
    
    if not hearing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hearing not found"
        )
    
    return HearingResponse(
        success=True,
        message="Hearing retrieved successfully",
        data=hearing
    )


@router.put("/{hearing_id}", response_model=HearingResponse)
async def update_hearing(
    hearing_id: int,
    hearing_update: HearingUpdate,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Update a specific hearing. Only updates hearings for the authenticated user's firm."""
    
    # Get existing hearing
    hearing = session.exec(
        select(Hearing).where(
            Hearing.id == hearing_id,
            Hearing.firm_id == current_user.firm_id
        )
    ).first()
    
    if not hearing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hearing not found"
        )
    
    # Update hearing fields
    update_data = hearing_update.dict(exclude_unset=True)
    if update_data:
        # Validate updated data
        merged_data = {**hearing.dict(), **update_data}
        validation_errors = validate_hearing_data(merged_data)
        if validation_errors:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Validation errors: {', '.join(validation_errors)}"
            )
        
        for field, value in update_data.items():
            setattr(hearing, field, value)
        
        hearing.updated_at = datetime.utcnow()
        hearing.updated_by = current_user.user_id
        
        session.add(hearing)
        session.commit()
        session.refresh(hearing)
    
    return HearingResponse(
        success=True,
        message="Hearing updated successfully",
        data=hearing
    )


@router.delete("/{hearing_id}", response_model=ResponseBase)
async def delete_hearing(
    hearing_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Delete a specific hearing. Only deletes hearings for the authenticated user's firm."""
    
    hearing = session.exec(
        select(Hearing).where(
            Hearing.id == hearing_id,
            Hearing.firm_id == current_user.firm_id
        )
    ).first()
    
    if not hearing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hearing not found"
        )
    
    session.delete(hearing)
    session.commit()
    
    return ResponseBase(
        success=True,
        message="Hearing deleted successfully"
    )


@router.get("/case/{case_id}/hearings", response_model=HearingListResponse)
async def get_case_hearings(
    case_id: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get all hearings for a specific case. Only returns hearings for the authenticated user's firm."""
    
    hearings = session.exec(
        select(Hearing).where(
            Hearing.case_id == case_id,
            Hearing.firm_id == current_user.firm_id
        ).order_by(Hearing.hearing_date.asc(), Hearing.hearing_time.asc())
    ).all()
    
    return HearingListResponse(
        success=True,
        message=f"Retrieved {len(hearings)} hearings for case",
        data={
            "hearings": hearings,
            "pagination": {
                "page": 1,
                "page_size": len(hearings),
                "total_pages": 1,
                "total_items": len(hearings),
                "has_next": False,
                "has_prev": False
            }
        }
    )





@router.get("/upcoming/week", response_model=ResponseBase)
async def get_upcoming_week_hearings(
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get upcoming hearings for the next week for the authenticated user's firm."""
    
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    week_end = today + timedelta(days=7)
    
    hearings = session.exec(
        select(Hearing).where(
            Hearing.firm_id == current_user.firm_id,
            Hearing.hearing_date >= today,
            Hearing.hearing_date <= week_end,
            Hearing.status == HearingStatus.SCHEDULED
        ).order_by(Hearing.hearing_date.asc(), Hearing.hearing_time.asc())
    ).all()
    
    upcoming = []
    for hearing in hearings:
        days_until = (hearing.hearing_date - today).days
        upcoming.append(UpcomingHearing(
            id=hearing.id,
            case_number=hearing.case_number,
            case_title=hearing.case_title,
            hearing_date=hearing.hearing_date,
            hearing_time=hearing.hearing_time,
            court_name=hearing.court_name,
            hearing_type=hearing.hearing_type,
            days_until=days_until
        ))
    
    return ResponseBase(
        success=True,
        message=f"Retrieved {len(upcoming)} upcoming hearings for this week",
        data=upcoming
    )


@router.get("/upcoming/month", response_model=ResponseBase)
async def get_upcoming_month_hearings(
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get upcoming hearings for the next month for the authenticated user's firm."""
    
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    month_end = today + timedelta(days=30)
    
    hearings = session.exec(
        select(Hearing).where(
            Hearing.firm_id == current_user.firm_id,
            Hearing.hearing_date >= today,
            Hearing.hearing_date <= month_end,
            Hearing.status == HearingStatus.SCHEDULED
        ).order_by(Hearing.hearing_date.asc(), Hearing.hearing_time.asc())
    ).all()
    
    upcoming = []
    for hearing in hearings:
        days_until = (hearing.hearing_date - today).days
        upcoming.append(UpcomingHearing(
            id=hearing.id,
            case_number=hearing.case_number,
            case_title=hearing.case_title,
            hearing_date=hearing.hearing_date,
            hearing_time=hearing.hearing_time,
            court_name=hearing.court_name,
            hearing_type=hearing.hearing_type,
            days_until=days_until
        ))
    
    return ResponseBase(
        success=True,
        message=f"Retrieved {len(upcoming)} upcoming hearings for this month",
        data=upcoming
    )


@router.get("/calendar/{year}/{month}", response_model=ResponseBase)
async def get_calendar_hearings(
    year: int,
    month: int,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get hearings for a specific month/year for calendar view."""
    
    # Calculate date range for the month
    from datetime import date
    import calendar
    
    try:
        start_date = date(year, month, 1)
        _, last_day = calendar.monthrange(year, month)
        end_date = date(year, month, last_day)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid year or month"
        )
    
    hearings = session.exec(
        select(Hearing).where(
            Hearing.firm_id == current_user.firm_id,
            Hearing.hearing_date >= start_date,
            Hearing.hearing_date <= end_date
        ).order_by(Hearing.hearing_date.asc(), Hearing.hearing_time.asc())
    ).all()
    
    # Format for calendar
    calendar_events = []
    for hearing in hearings:
        calendar_events.append(HearingCalendarEvent(
            id=hearing.id,
            title=f"{hearing.case_title} - {hearing.hearing_type}",
            date=hearing.hearing_date,
            time=hearing.hearing_time,
            court=hearing.court_name,
            type=hearing.hearing_type,
            status=hearing.status,
            case_number=hearing.case_number
        ))
    
    return ResponseBase(
        success=True,
        message=f"Retrieved {len(calendar_events)} hearings for {year}-{month:02d}",
        data=calendar_events
    )
