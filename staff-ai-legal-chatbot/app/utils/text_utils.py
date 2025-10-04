import re
from typing import List, Dict
from app.config import settings

def chunk_text(text: str, chunk_size: int = None, chunk_overlap: int = None) -> List[str]:
    """
    Split text into chunks with overlapping content.
    
    Args:
        text (str): Text to be chunked
        chunk_size (int): Size of each chunk in characters
        chunk_overlap (int): Number of characters to overlap between chunks
        
    Returns:
        List[str]: List of text chunks
    """
    if chunk_size is None:
        chunk_size = settings.chunk_size
    if chunk_overlap is None:
        chunk_overlap = settings.chunk_overlap
    
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # If this is not the last chunk, try to break at sentence boundary
        if end < len(text):
            # Look for sentence endings near the chunk boundary
            sentence_end = text.rfind('.', start, end)
            if sentence_end != -1 and sentence_end > start + chunk_size // 2:
                end = sentence_end + 1
            else:
                # Look for paragraph breaks
                paragraph_end = text.rfind('\n', start, end)
                if paragraph_end != -1 and paragraph_end > start + chunk_size // 2:
                    end = paragraph_end + 1
                else:
                    # Look for space to avoid breaking words
                    space_end = text.rfind(' ', start, end)
                    if space_end != -1 and space_end > start + chunk_size // 2:
                        end = space_end + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move start position with overlap
        start = end - chunk_overlap
        
        # Prevent infinite loop
        if start >= len(text):
            break
    
    return chunks

def preprocess_text(text: str) -> str:
    """
    Preprocess text for better embedding and retrieval.
    
    Args:
        text (str): Raw text to preprocess
        
    Returns:
        str: Preprocessed text
    """
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep punctuation
    text = re.sub(r'[^\w\s.,!?;:()\-\'"]', '', text)
    
    # Normalize quotes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'")
    
    return text.strip()

def extract_metadata(text: str, filename: str) -> Dict[str, str]:
    """
    Extract metadata from text content.
    
    Args:
        text (str): Text content
        filename (str): Original filename
        
    Returns:
        Dict[str, str]: Metadata dictionary
    """
    metadata = {
        'filename': filename,
        'word_count': str(len(text.split())),
        'char_count': str(len(text)),
        'file_type': filename.split('.')[-1].lower() if '.' in filename else 'unknown'
    }
    
    # Try to extract title (first non-empty line)
    lines = text.split('\n')
    title = None
    for line in lines:
        line = line.strip()
        if line and len(line) > 5:
            title = line[:100]  # First 100 characters
            break
    
    if title:
        metadata['title'] = title
    
    return metadata

def is_meaningful_text(text: str, min_length: int = 20) -> bool:
    """
    Check if text contains meaningful content.
    
    Args:
        text (str): Text to check
        min_length (int): Minimum length for meaningful text
        
    Returns:
        bool: True if text is meaningful
    """
    if not text or len(text.strip()) < min_length:
        return False
    
    # Check if text contains mostly special characters
    alphanumeric_chars = sum(1 for c in text if c.isalnum())
    if alphanumeric_chars / len(text) < 0.3:
        return False
    
    return True
