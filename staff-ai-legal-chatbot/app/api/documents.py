from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging

from app.services.document_service import document_processor
from app.models.schemas import DocumentUpload, DocumentInfo, DocumentList, ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentUpload)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and process a document.
    
    - **file**: Document file (PDF, DOCX, or TXT)
    """
    try:
        result = await document_processor.process_document(file)
        return DocumentUpload(**result)
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=DocumentList)
async def list_documents():
    """List all uploaded documents."""
    try:
        documents = document_processor.list_documents()
        return DocumentList(
            documents=documents,
            total_count=len(documents)
        )
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{file_id}", response_model=DocumentInfo)
async def get_document(file_id: str):
    """Get information about a specific document."""
    try:
        document = document_processor.get_document_info(file_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return DocumentInfo(**document)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{file_id}")
async def delete_document(file_id: str):
    """Delete a document and all its chunks."""
    try:
        success = document_processor.delete_document(file_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        return {"message": "Document deleted successfully", "file_id": file_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_documents(
    query: str,
    n_results: int = 5,
    filter_by_file: Optional[str] = None
):
    """Search for relevant document chunks."""
    try:
        results = document_processor.search_documents(
            query=query,
            n_results=n_results,
            filter_by_file=filter_by_file
        )
        return results
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/overview")
async def get_statistics():
    """Get document processing statistics."""
    try:
        stats = document_processor.get_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear-all")
async def clear_all_documents():
    """Clear all documents from the database."""
    try:
        success = document_processor.clear_all_documents()
        if not success:
            raise HTTPException(status_code=500, detail="Failed to clear documents")
        return {"message": "All documents cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing all documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
