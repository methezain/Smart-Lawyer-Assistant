from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentSource(BaseModel):
    """Model for document source information"""
    filename: str = Field(..., description="Source document filename")
    chunk_id: str = Field(..., description="Chunk identifier")
    score: float = Field(..., description="Similarity score")
    file_id: str = Field(..., description="File identifier")

class ChatMessage(BaseModel):
    """Model for chat messages"""
    message: str = Field(..., description="User's message/query")
    session_id: Optional[str] = Field(None, description="Session ID for conversation tracking")

class ChatResponse(BaseModel):
    """Model for chat responses"""
    response: str = Field(..., description="AI response to user query")
    sources: Optional[List[DocumentSource]] = Field(None, description="Source documents used for response")
    session_id: Optional[str] = Field(None, description="Session ID")
    timestamp: datetime = Field(default_factory=datetime.now)
    response_type: Optional[str] = Field(None, description="Type of response (rag/general)")
    context_used: Optional[int] = Field(None, description="Number of context chunks used")

class DocumentUpload(BaseModel):
    """Model for document upload response"""
    filename: str = Field(..., description="Name of uploaded file")
    file_id: str = Field(..., description="Unique identifier for the file")
    status: str = Field(..., description="Upload status")
    message: str = Field(..., description="Upload message")
    chunks_created: Optional[int] = Field(None, description="Number of text chunks created")

class DocumentInfo(BaseModel):
    """Model for document information"""
    file_id: str = Field(..., description="Unique identifier for the file")
    filename: str = Field(..., description="Original filename")
    upload_date: datetime = Field(..., description="Upload timestamp")
    file_size: int = Field(..., description="File size in bytes")
    chunk_count: int = Field(..., description="Number of text chunks")
    status: str = Field(..., description="Processing status")

class DocumentList(BaseModel):
    """Model for listing documents"""
    documents: List[DocumentInfo] = Field(..., description="List of uploaded documents")
    total_count: int = Field(..., description="Total number of documents")

class ErrorResponse(BaseModel):
    """Model for error responses"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.now)

class HealthCheck(BaseModel):
    """Model for health check response"""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = Field(default="1.0.0", description="API version")
    database_status: str = Field(..., description="Database connection status")
