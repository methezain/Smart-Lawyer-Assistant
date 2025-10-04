import os
import uuid
from pathlib import Path
from fastapi import UploadFile
import shutil

# Define upload directory
UPLOAD_DIR = Path("uploads")

def ensure_upload_dir():
    """Ensure upload directory exists."""
    UPLOAD_DIR.mkdir(exist_ok=True)
    
    # Create subdirectories
    (UPLOAD_DIR / "profile_images").mkdir(exist_ok=True)
    (UPLOAD_DIR / "cnic").mkdir(exist_ok=True)
    (UPLOAD_DIR / "documents").mkdir(exist_ok=True)
    (UPLOAD_DIR / "banner_images").mkdir(exist_ok=True)

def get_unique_filename(original_filename):
    """Generate a unique filename with original extension."""
    if not original_filename:
        return f"{uuid.uuid4()}.dat"
    
    # Get file extension
    extension = Path(original_filename).suffix.lower()
    
    # Generate unique filename
    return f"{uuid.uuid4()}{extension}"

async def save_upload_file(file: UploadFile, category: str) -> str:
    """
    Save an uploaded file to the appropriate directory.
    
    Args:
        file (UploadFile): The uploaded file
        category (str): Category of the file (profile_images, cnic, documents)
    
    Returns:
        str: Path to the saved file relative to the upload directory
    """
    if not file:
        return ""  # Return empty string instead of None for type safety
    
    # Ensure upload directory exists
    ensure_upload_dir()
    
    # Get appropriate subdirectory
    if category not in ["profile_images", "cnic", "documents", "banner_images"]:
        category = "documents"  # Default to documents
    
    subdir = UPLOAD_DIR / category
    
    # Generate unique filename
    filename = get_unique_filename(file.filename)
    file_path = subdir / filename
    
    try:
        # Make sure we're at the beginning of the file
        await file.seek(0)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Return relative path for database storage
        return str(Path(category) / filename)
    except Exception as e:
        print(f"Error saving file: {e}")
        return ""  # Return empty string on error

def delete_file(file_path: str) -> bool:
    """
    Delete a file from the upload directory.
    
    Args:
        file_path (str): Path to the file relative to the upload directory
    
    Returns:
        bool: True if file was deleted successfully, False otherwise
    """
    if not file_path:
        return False
    
    # Get absolute path
    full_path = UPLOAD_DIR / file_path
    
    try:
        if full_path.exists():
            full_path.unlink()
            return True
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    return False 