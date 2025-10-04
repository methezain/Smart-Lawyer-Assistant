from app.schemas import Pagination

def calculate_pagination(page: int, page_size: int, total: int) -> Pagination:
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 1
    return Pagination(page=page, page_size=page_size, total=total, total_pages=total_pages)
