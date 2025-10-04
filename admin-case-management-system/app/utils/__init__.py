from datetime import date, datetime
from typing import Dict, List, Optional
from sqlmodel import Session, select
import re


def generate_case_number(case_type: str, filing_date: date, session: Session, firm_id: Optional[int] = None) -> str:
    """
    Generate a unique case number based on case type and filing date
    Format: TYPE-YEAR-SEQUENTIAL (e.g., CIV-2023-138)
    If firm_id is provided, the sequential number is scoped to that firm
    """
    from app.models import Case
    
    filing_year = filing_date.year
    
    # Define case type prefixes
    case_prefix = get_case_prefix(case_type)
    
    # Get existing case count for this type in current year
    statement = select(Case).where(
        Case.type == case_type,
        Case.year_filed == filing_year
    )
    
    # Add firm filter if provided
    if firm_id is not None:
        statement = statement.where(Case.firm_id == firm_id)
    
    existing_cases = session.exec(statement).all()
    
    # Use sequential number based on existing cases of same type/year (and firm if specified)
    sequential_number = str(len(existing_cases) + 1).zfill(3)
    
    # Format: TYPE-YEAR-SEQUENTIAL
    case_number = f"{case_prefix}-{filing_year}-{sequential_number}"
    
    # Ensure uniqueness (in case of race conditions)
    counter = 1
    original_number = case_number
    while session.exec(select(Case).where(Case.case_number == case_number)).first():
        counter += 1
        sequential_number = str(len(existing_cases) + counter).zfill(3)
        case_number = f"{case_prefix}-{filing_year}-{sequential_number}"
    
    return case_number


def get_case_prefix(case_type: str) -> str:
    """Get case type prefix for case number generation"""
    # Handle predefined case types
    prefix_mapping = {
        "Civil": "CIV",
        "Criminal": "CRI",
        "Commercial": "COM",
        "Family": "FAM",
        "Corporate": "COR",
        "Property": "PRO",
        "Employment": "EMP",
        "Immigration": "IMM",
        "Intellectual": "INT",
        "Tax": "TAX"
    }
    
    if case_type in prefix_mapping:
        return prefix_mapping[case_type]
    
    # Handle custom case types - generate prefix from the case type name
    if case_type and case_type != "Other":
        # Remove special characters and spaces, take first 3 characters and convert to uppercase
        clean_type = re.sub(r'[^a-zA-Z]', '', case_type).upper()
        return clean_type[:3].ljust(3, 'X')  # Pad with 'X' if less than 3 characters
    
    # Fallback
    return "GEN"


def get_case_priority(case_type: str) -> str:
    """Get case type priority level"""
    priority_levels = {
        "Criminal": "high",
        "Family": "high",
        "Immigration": "high",
        "Civil": "medium",
        "Commercial": "medium",
        "Corporate": "medium",
        "Property": "medium",
        "Employment": "medium",
        "Intellectual": "low",
        "Tax": "low",
    }
    
    return priority_levels.get(case_type, "medium")


def get_hearing_urgency(next_hearing: Optional[date]) -> Optional[str]:
    """Get case urgency based on next hearing date"""
    if not next_hearing:
        return None
    
    today = date.today()
    diff_days = (next_hearing - today).days
    
    if diff_days < 0:
        return "overdue"  # Past hearing
    elif diff_days <= 3:
        return "urgent"   # Within 3 days
    elif diff_days <= 7:
        return "soon"     # Within a week
    else:
        return "normal"


def calculate_pagination(page: int, page_size: int, total_items: int) -> Dict:
    """Calculate pagination information"""
    total_pages = (total_items + page_size - 1) // page_size
    has_next = page < total_pages
    has_previous = page > 1
    
    return {
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_previous": has_previous
    }


def format_case_description(
    case_background: Optional[str] = None,
    legal_issues: Optional[str] = None,
    relevant_laws: Optional[str] = None,
    prayer_relief: Optional[str] = None,
    evidence_documents: Optional[str] = None
) -> str:
    """Format case description from structured fields"""
    description_parts = []
    
    if case_background:
        description_parts.append(f"Background: {case_background}")
    
    if legal_issues:
        description_parts.append(f"Legal Issues: {legal_issues}")
    
    if relevant_laws:
        description_parts.append(f"Relevant Laws: {relevant_laws}")
    
    if prayer_relief:
        description_parts.append(f"Prayer/Relief: {prayer_relief}")
    
    if evidence_documents:
        description_parts.append(f"Evidence Documents: {evidence_documents}")
    
    return "\n\n".join(description_parts)


def parse_case_description(description: str) -> Dict[str, str]:
    """Parse structured case description back to individual fields"""
    result = {
        "case_background": "",
        "legal_issues": "",
        "relevant_laws": "",
        "prayer_relief": ""
    }
    
    if not description:
        return result
    
    sections = description.split("\n\n")
    
    for section in sections:
        if section.startswith("Background: "):
            result["case_background"] = section.replace("Background: ", "")
        elif section.startswith("Legal Issues: "):
            result["legal_issues"] = section.replace("Legal Issues: ", "")
        elif section.startswith("Relevant Laws: "):
            result["relevant_laws"] = section.replace("Relevant Laws: ", "")
        elif section.startswith("Prayer/Relief: "):
            result["prayer_relief"] = section.replace("Prayer/Relief: ", "")
    
    return result


def validate_case_data(case_data: Dict) -> List[str]:
    """Validate case data and return list of errors"""
    errors = []
    
    # Required fields validation
    required_fields = ['title', 'client_id', 'opponent', 'type', 'court_name', 'filing_date']
    for field in required_fields:
        if not case_data.get(field):
            errors.append(f"{field.replace('_', ' ').title()} is required")
    
    # Date validation
    if case_data.get('filing_date'):
        try:
            filing_date = datetime.strptime(case_data['filing_date'], '%Y-%m-%d').date()
            if filing_date > date.today():
                errors.append("Filing date cannot be in the future")
        except ValueError:
            errors.append("Invalid filing date format. Use YYYY-MM-DD")
    
    if case_data.get('next_hearing'):
        try:
            next_hearing = datetime.strptime(case_data['next_hearing'], '%Y-%m-%d').date()
            filing_date = datetime.strptime(case_data.get('filing_date', ''), '%Y-%m-%d').date()
            if next_hearing < filing_date:
                errors.append("Next hearing date cannot be before filing date")
        except ValueError:
            errors.append("Invalid next hearing date format. Use YYYY-MM-DD")
    
    return errors


def get_case_statistics(session: Session, firm_id: Optional[int] = None) -> Dict:
    """Get case statistics for dashboard, optionally filtered by firm_id"""
    from app.models import Case, CaseStatus
    from datetime import timedelta
    
    today = date.today()
    current_month_start = today.replace(day=1)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    current_week_start = today - timedelta(days=today.weekday())
    current_quarter_start = today.replace(month=((today.month-1)//3)*3+1, day=1)
    
    # Base query - add firm filter if provided
    base_query = select(Case)
    if firm_id is not None:
        base_query = base_query.where(Case.firm_id == firm_id)
    
    # Total cases by status
    total_cases = len(session.exec(base_query).all())
    
    active_query = base_query.where(Case.status == CaseStatus.ACTIVE)
    active_cases = len(session.exec(active_query).all())
    
    pending_query = base_query.where(Case.status == CaseStatus.PENDING)
    pending_cases = len(session.exec(pending_query).all())
    
    closed_query = base_query.where(Case.status == CaseStatus.CLOSED)
    closed_cases = len(session.exec(closed_query).all())
    
    # Monthly changes - cases created this month
    current_month_query = base_query.where(Case.filing_date >= current_month_start)
    current_month_cases = len(session.exec(current_month_query).all())
    
    current_month_active_query = base_query.where(
        Case.status == CaseStatus.ACTIVE,
        Case.filing_date >= current_month_start
    )
    current_month_active = len(session.exec(current_month_active_query).all())
    
    # Weekly hearings
    upcoming_week_end = today + timedelta(days=7)
    weekly_hearings_query = base_query.where(
        Case.next_hearing.isnot(None),
        Case.next_hearing >= today,
        Case.next_hearing <= upcoming_week_end
    )
    weekly_hearings = len(session.exec(weekly_hearings_query).all())
    
    # Quarterly new clients (assuming filing_date indicates new client relationship)
    quarterly_query = base_query.where(Case.filing_date >= current_quarter_start)
    quarterly_cases = len(session.exec(quarterly_query).all())
    
    # Get unique clients for quarterly count
    quarterly_clients_query = select(Case.client_id).where(Case.filing_date >= current_quarter_start)
    if firm_id is not None:
        quarterly_clients_query = quarterly_clients_query.where(Case.firm_id == firm_id)
    quarterly_clients_query = quarterly_clients_query.distinct()
    
    quarterly_clients_result = session.exec(quarterly_clients_query).all()
    quarterly_clients = len(quarterly_clients_result)
    
    # Upcoming hearings (next 7 days)
    upcoming_date = today + timedelta(days=7)
    upcoming_hearings_query = base_query.where(
        Case.next_hearing.isnot(None),
        Case.next_hearing <= upcoming_date,
        Case.next_hearing >= today
    )
    upcoming_hearings = len(session.exec(upcoming_hearings_query).all())
    
    return {
        "total_cases": total_cases,
        "active_cases": active_cases,
        "pending_cases": pending_cases,
        "closed_cases": closed_cases,
        "upcoming_hearings": upcoming_hearings,
        "monthly_changes": {
            "total_cases": current_month_cases,
            "active_cases": current_month_active
        },
        "weekly_hearings": weekly_hearings,
        "quarterly_clients": quarterly_clients
    }
