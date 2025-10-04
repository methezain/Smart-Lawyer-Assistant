from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, or_
from typing import List, Optional
from datetime import date, datetime

from app.database import get_session
from app.models import Case, CaseStatus
from app.schemas import (
    CaseCreate, CaseUpdate, CaseResponse, CaseListResponse,
    PaginationParams, CaseFilters, ResponseBase, CaseSortEnum,
    NotFoundResponse, ValidationErrorResponse, CaseStatistics
)
from app.utils import (
    generate_case_number, calculate_pagination, format_case_description,
    validate_case_data, get_case_statistics
)
from app.auth import get_current_user, get_user_firm_filter, JWTTokenData

router = APIRouter(prefix="/cases", tags=["cases"])


def _to_case_response(case: Case) -> CaseResponse:
    """Helper to map Case ORM to API response, including staff_* aliases."""
    resp = CaseResponse.from_orm(case)
    # Provide aliases expected by frontend
    resp.staff_id = case.assigned_lawyer_id
    resp.staff_name = case.assigned_lawyer_name
    return resp


@router.get("/", response_model=CaseListResponse)
async def get_cases(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search in title, case number, client name, or lawyer name"),
    status: Optional[CaseStatus] = Query(None, description="Filter by case status"),
    type: Optional[str] = Query(None, description="Filter by case type"),
    assigned_lawyer_id: Optional[int] = Query(None, description="Filter by assigned lawyer"),
    staff_id: Optional[int] = Query(None, description="Alias for assigned lawyer id (staff_id)"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    filing_date_from: Optional[date] = Query(None, description="Filter cases filed from this date"),
    filing_date_to: Optional[date] = Query(None, description="Filter cases filed to this date"),
    next_hearing_from: Optional[date] = Query(None, description="Filter by next hearing from date"),
    next_hearing_to: Optional[date] = Query(None, description="Filter by next hearing to date"),
    sort_by: CaseSortEnum = Query(CaseSortEnum.LATEST, description="Sort cases by"),
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get a paginated list of cases with filtering and sorting options. Only returns cases for the authenticated user's firm."""
    
    # Build base query with firm filtering
    statement = select(Case).where(Case.firm_id == current_user.firm_id)
    
    # Apply search filter
    if search:
        search_filter = or_(
            Case.title.ilike(f"%{search}%"),
            Case.case_number.ilike(f"%{search}%"),
            Case.client_name.ilike(f"%{search}%"),
            Case.assigned_lawyer_name.ilike(f"%{search}%")
        )
        statement = statement.where(search_filter)
    
    # Apply filters
    if status:
        statement = statement.where(Case.status == status)
    if type:
        statement = statement.where(Case.type == type)
    if assigned_lawyer_id or staff_id:
        statement = statement.where(Case.assigned_lawyer_id == (assigned_lawyer_id or staff_id))
    if client_id:
        statement = statement.where(Case.client_id == client_id)
    if filing_date_from:
        statement = statement.where(Case.filing_date >= filing_date_from)
    if filing_date_to:
        statement = statement.where(Case.filing_date <= filing_date_to)
    if next_hearing_from:
        statement = statement.where(Case.next_hearing >= next_hearing_from)
    if next_hearing_to:
        statement = statement.where(Case.next_hearing <= next_hearing_to)
    
    # Apply sorting
    if sort_by == CaseSortEnum.LATEST:
        statement = statement.order_by(Case.filing_date.desc())
    elif sort_by == CaseSortEnum.OLDEST:
        statement = statement.order_by(Case.filing_date.asc())
    elif sort_by == CaseSortEnum.UPCOMING:
        statement = statement.where(Case.next_hearing.isnot(None)).order_by(Case.next_hearing.asc())
    elif sort_by == CaseSortEnum.CASE_NUMBER:
        statement = statement.order_by(Case.case_number.asc())
    elif sort_by == CaseSortEnum.TITLE:
        statement = statement.order_by(Case.title.asc())
    elif sort_by == CaseSortEnum.STATUS:
        statement = statement.order_by(Case.status.asc())
    
    # Get total count
    total_cases = len(session.exec(statement).all())
    
    # Apply pagination
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    
    # Execute query and convert to response objects
    cases = session.exec(statement).all()
    case_responses = [_to_case_response(case) for case in cases]
    
    # Calculate pagination info
    pagination_info = calculate_pagination(page, page_size, total_cases)
    
    return CaseListResponse(
        cases=case_responses,
        pagination=pagination_info
    )


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: int, 
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get a specific case by ID. Only returns cases for the authenticated user's firm."""
    statement = select(Case).where(Case.id == case_id, Case.firm_id == current_user.firm_id)
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    return _to_case_response(case)


@router.get("/number/{case_number}", response_model=CaseResponse)
async def get_case_by_number(
    case_number: str, 
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get a specific case by case number. Only returns cases for the authenticated user's firm."""
    statement = select(Case).where(
        Case.case_number == case_number, 
        Case.firm_id == current_user.firm_id
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    return _to_case_response(case)


@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    case_data: CaseCreate, 
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Create a new case. Associates the case with the authenticated user's firm."""
    
    # Generate case number
    case_number = generate_case_number(case_data.type, case_data.filing_date, session, current_user.firm_id)
    
    # Create structured description
    description = format_case_description(
        case_data.case_background,
        case_data.legal_issues,
        case_data.relevant_laws,
        case_data.prayer_relief,
        case_data.evidence_documents
    )
    
    # Create case with all fields including names and firm_id
    # Accept staff_* aliases and map to assigned_lawyer_* for storage
    # Exclude both alias fields and canonical assigned_lawyer_* to avoid duplicate kwargs
    case_dict = case_data.dict(exclude={
        "description",
        "staff_id",
        "staff_name",
        "assigned_lawyer_id",
        "assigned_lawyer_name",
    })
    # Map alias values if provided
    aliased_lawyer_id = getattr(case_data, "assigned_lawyer_id", None) or getattr(case_data, "staff_id", None)
    aliased_lawyer_name = getattr(case_data, "assigned_lawyer_name", None) or getattr(case_data, "staff_name", None)
    
    case = Case(
        **case_dict,
        assigned_lawyer_id=aliased_lawyer_id,
        assigned_lawyer_name=aliased_lawyer_name,
        case_number=case_number,
        description=description,
        firm_id=current_user.firm_id,  # Associate with user's firm
        year_filed=case_data.filing_date.year,
        month_filed=case_data.filing_date.month,
        created_at=datetime.utcnow()
    )
    
    session.add(case)
    session.commit()
    session.refresh(case)
    
    return _to_case_response(case)


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: int,
    case_update: CaseUpdate,
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Update an existing case. Only allows updating cases for the authenticated user's firm."""
    statement = select(Case).where(Case.id == case_id, Case.firm_id == current_user.firm_id)
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Update case fields
    update_data = case_update.dict(exclude_unset=True)
    # Handle aliases in updates
    staff_id_alias = update_data.pop("staff_id", None)
    staff_name_alias = update_data.pop("staff_name", None)
    if staff_id_alias is not None and not update_data.get("assigned_lawyer_id"):
        update_data["assigned_lawyer_id"] = staff_id_alias
    if staff_name_alias is not None and not update_data.get("assigned_lawyer_name"):
        update_data["assigned_lawyer_name"] = staff_name_alias
    
    for field, value in update_data.items():
        setattr(case, field, value)
    
    # Update structured description if any description fields are provided
    if any(field in case_update.dict(exclude_unset=True) for field in 
           ["case_background", "legal_issues", "relevant_laws", "prayer_relief", "evidence_documents"]):
        
        # Use the updated case fields to recreate description
        case.description = format_case_description(
            case.case_background,
            case.legal_issues,
            case.relevant_laws,
            case.prayer_relief,
            case.evidence_documents
        )
    
    # Update year and month if filing date changed
    if case_update.filing_date:
        case.year_filed = case_update.filing_date.year
        case.month_filed = case_update.filing_date.month
    
    case.updated_at = datetime.utcnow()
    
    session.add(case)
    session.commit()
    session.refresh(case)
    
    return _to_case_response(case)


@router.delete("/{case_id}", response_model=ResponseBase)
async def delete_case(
    case_id: int, 
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Delete a case. Only allows deleting cases for the authenticated user's firm."""
    statement = select(Case).where(Case.id == case_id, Case.firm_id == current_user.firm_id)
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    session.delete(case)
    session.commit()
    
    return ResponseBase(
        success=True,
        message="Case deleted successfully"
    )


@router.get("/types/", response_model=List[str])
async def get_case_types(
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get all unique case types in the system for the authenticated user's firm."""
    statement = select(Case.type).where(Case.firm_id == current_user.firm_id).distinct()
    types = session.exec(statement).all()
    return sorted(types)


@router.get("/statistics/", response_model=CaseStatistics)
async def get_case_statistics_endpoint(
    session: Session = Depends(get_session),
    current_user: JWTTokenData = Depends(get_current_user)
):
    """Get case statistics for dashboard for the authenticated user's firm."""
    stats_data = get_case_statistics(session, firm_id=current_user.firm_id)
    return CaseStatistics(**stats_data)
