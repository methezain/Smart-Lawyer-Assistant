import os
import uuid
import aiofiles
from typing import Optional
from fastapi import UploadFile, HTTPException
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def generate_file_id() -> str:
    """Generate unique file ID."""
    return str(uuid.uuid4())

def get_file_extension(filename: str) -> str:
    """Get file extension from filename."""
    return filename.split('.')[-1].lower() if '.' in filename else ''

def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    extension = get_file_extension(filename)
    return extension in settings.allowed_extensions

def validate_file_size(file_size: int) -> bool:
    """Validate file size against maximum allowed size."""
    return file_size <= settings.max_file_size

def get_safe_filename(filename: str) -> str:
    """Create a safe filename by removing special characters."""
    # Remove special characters and replace spaces with underscores
    safe_name = "".join(c for c in filename if c.isalnum() or c in '._-')
    return safe_name[:100]  # Limit length

def create_unique_filename(original_filename: str, file_id: str) -> str:
    """Create unique filename using file ID."""
    extension = get_file_extension(original_filename)
    safe_name = get_safe_filename(original_filename.rsplit('.', 1)[0])
    return f"{file_id}_{safe_name}.{extension}"

async def save_uploaded_file(file: UploadFile, file_id: str) -> str:
    """
    Save uploaded file to disk.
    
    Args:
        file: FastAPI UploadFile object
        file_id: Unique file identifier
        
    Returns:
        str: Path to saved file
        
    Raises:
        HTTPException: If file validation fails
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(settings.allowed_extensions)}"
        )
    
    # Read file content to check size
    content = await file.read()
    if not validate_file_size(len(content)):
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size: {settings.max_file_size} bytes"
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Create unique filename
    unique_filename = create_unique_filename(file.filename, file_id)
    file_path = os.path.join(settings.upload_directory, unique_filename)
    
    try:
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        logger.info(f"File saved: {file_path}")
        return file_path
    
    except Exception as e:
        logger.error(f"Error saving file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save file")

def delete_file(file_path: str) -> bool:
    """
    Delete file from disk.
    
    Args:
        file_path: Path to file to delete
        
    Returns:
        bool: True if file was deleted successfully
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"File deleted: {file_path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting file {file_path}: {str(e)}")
        return False

def get_file_size(file_path: str) -> int:
    """Get file size in bytes."""
    try:
        return os.path.getsize(file_path)
    except Exception:
        return 0

def file_exists(file_path: str) -> bool:
    """Check if file exists."""
    return os.path.exists(file_path)

def cleanup_old_files(directory: str, max_age_days: int = 7) -> int:
    """
    Clean up old files from directory.
    
    Args:
        directory: Directory to clean
        max_age_days: Maximum age in days
        
    Returns:
        int: Number of files deleted
    """
    import time
    
    deleted_count = 0
    current_time = time.time()
    max_age_seconds = max_age_days * 24 * 60 * 60
    
    try:
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > max_age_seconds:
                    if delete_file(file_path):
                        deleted_count += 1
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
    
    return deleted_count
