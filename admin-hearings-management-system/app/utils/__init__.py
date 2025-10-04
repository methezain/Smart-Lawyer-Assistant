from sqlmodel import Session, select, func
from typing import Dict, List, Any, Tuple
from datetime import date, datetime, timedelta
import math
from collections import defaultdict

from app.models import Hearing, HearingStatus
from app.schemas import PaginationParams, HearingStatistics, UpcomingHearing


def calculate_pagination(page: int, page_size: int, total_items: int) -> PaginationParams:
    """
    Calculate pagination parameters
    
    Args:
        page: Current page number
        page_size: Number of items per page
        total_items: Total number of items
        
    Returns:
        PaginationParams: Pagination information
    """
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1
    
    return PaginationParams(
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        total_items=total_items,
        has_next=page < total_pages,
        has_prev=page > 1
    )


def validate_hearing_data(hearing_data: dict) -> List[str]:
    """
    Validate hearing data
    
    Args:
        hearing_data: Dictionary containing hearing data
        
    Returns:
        List[str]: List of validation errors
    """
    errors = []
    
    # Check required fields
    required_fields = [
        'case_id', 'case_number', 'case_title', 'hearing_date', 
        'hearing_time', 'hearing_type', 'court_name', 'judge_name', 
        'court_location'
    ]
    
    for field in required_fields:
        if not hearing_data.get(field):
            errors.append(f"{field.replace('_', ' ').title()} is required")
    
    # Validate hearing date is not in the past
    if hearing_data.get('hearing_date'):
        try:
            hearing_date = hearing_data['hearing_date']
            if isinstance(hearing_date, str):
                hearing_date = datetime.strptime(hearing_date, '%Y-%m-%d').date()
            
            if hearing_date < date.today():
                errors.append("Hearing date cannot be in the past")
        except ValueError:
            errors.append("Invalid hearing date format")
    
    return errors


def get_hearing_statistics(session: Session, firm_id: int) -> HearingStatistics:
    """
    Get hearing statistics for a firm
    
    Args:
        session: Database session
        firm_id: Firm ID
        
    Returns:
        HearingStatistics: Statistics data
    """
    # Base query for firm's hearings
    base_query = select(Hearing).where(Hearing.firm_id == firm_id)
    
    # Total hearings
    total_hearings = len(session.exec(base_query).all())
    
    # Hearings by status
    scheduled = len(session.exec(
        base_query.where(Hearing.status == HearingStatus.SCHEDULED)
    ).all())
    
    completed = len(session.exec(
        base_query.where(Hearing.status == HearingStatus.COMPLETED)
    ).all())
    
    postponed = len(session.exec(
        base_query.where(Hearing.status == HearingStatus.POSTPONED)
    ).all())
    
    cancelled = len(session.exec(
        base_query.where(Hearing.status == HearingStatus.CANCELLED)
    ).all())
    
    # Upcoming hearings
    today = date.today()
    week_end = today + timedelta(days=7)
    month_end = today + timedelta(days=30)
    
    upcoming_week = len(session.exec(
        base_query.where(
            Hearing.hearing_date >= today,
            Hearing.hearing_date <= week_end,
            Hearing.status == HearingStatus.SCHEDULED
        )
    ).all())
    
    upcoming_month = len(session.exec(
        base_query.where(
            Hearing.hearing_date >= today,
            Hearing.hearing_date <= month_end,
            Hearing.status == HearingStatus.SCHEDULED
        )
    ).all())
    
    # Get all hearings for grouping
    all_hearings = session.exec(base_query).all()
    
    # Group by type
    by_type = defaultdict(int)
    for hearing in all_hearings:
        by_type[hearing.hearing_type] += 1
    
    # Group by court
    by_court = defaultdict(int)
    for hearing in all_hearings:
        by_court[hearing.court_name] += 1
    
    # Group by month
    by_month = defaultdict(int)
    for hearing in all_hearings:
        month_key = hearing.hearing_date.strftime('%Y-%m')
        by_month[month_key] += 1
    
    return HearingStatistics(
        total_hearings=total_hearings,
        scheduled_hearings=scheduled,
        completed_hearings=completed,
        postponed_hearings=postponed,
        cancelled_hearings=cancelled,
        upcoming_this_week=upcoming_week,
        upcoming_this_month=upcoming_month,
        by_type=dict(by_type),
        by_court=dict(by_court),
        by_month=dict(by_month)
    )


def get_upcoming_hearings(session: Session, firm_id: int, days_ahead: int = 7) -> List[UpcomingHearing]:
    """
    Get upcoming hearings for a firm
    
    Args:
        session: Database session
        firm_id: Firm ID
        days_ahead: Number of days to look ahead
        
    Returns:
        List[UpcomingHearing]: List of upcoming hearings
    """
    today = date.today()
    end_date = today + timedelta(days=days_ahead)
    
    hearings = session.exec(
        select(Hearing).where(
            Hearing.firm_id == firm_id,
            Hearing.hearing_date >= today,
            Hearing.hearing_date <= end_date,
            Hearing.status == HearingStatus.SCHEDULED
        ).order_by(Hearing.hearing_date, Hearing.hearing_time)
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
    
    return upcoming


def format_hearing_time(hearing_time) -> str:
    """
    Format hearing time for display
    
    Args:
        hearing_time: Time object or string
        
    Returns:
        str: Formatted time string
    """
    if isinstance(hearing_time, str):
        return hearing_time
    
    return hearing_time.strftime('%H:%M')


def parse_required_documents(documents_str: str) -> List[str]:
    """
    Parse required documents string into list
    
    Args:
        documents_str: Comma-separated documents string
        
    Returns:
        List[str]: List of documents
    """
    if not documents_str:
        return []
    
    return [doc.strip() for doc in documents_str.split(',') if doc.strip()]


def format_required_documents(documents: List[str]) -> str:
    """
    Format list of documents into string
    
    Args:
        documents: List of documents
        
    Returns:
        str: Comma-separated documents string
    """
    if not documents:
        return ""
    
    return ", ".join(documents)
