from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List, Optional
import logging
import json

from app.services.chat_service import chat_service
from app.models.schemas import ChatMessage, ChatResponse, ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/message", response_model=ChatResponse)
async def send_message(message: ChatMessage):
    """
    Send a message to the chatbot.
    
    - **message**: The user's message
    - **session_id**: Optional session ID for conversation tracking
    """
    try:
        result = await chat_service.process_chat_message(
            message=message.message,
            session_id=message.session_id,
            use_documents=True,
            n_context_docs=5
        )
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/message/stream")
async def send_message_stream(message: ChatMessage):
    """
    Send a message to the chatbot with streaming response.
    
    - **message**: The user's message
    - **session_id**: Optional session ID for conversation tracking
    """
    try:
        async def generate_stream():
            async for chunk in chat_service.process_chat_message_stream(
                message=message.message,
                session_id=message.session_id,
                use_documents=True,
                n_context_docs=5
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
    except Exception as e:
        logger.error(f"Error processing streaming chat message: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/general", response_model=ChatResponse)
async def send_general_message(message: ChatMessage):
    """
    Send a general message (without document context).
    
    - **message**: The user's message
    - **session_id**: Optional session ID for conversation tracking
    """
    try:
        result = await chat_service.process_chat_message(
            message=message.message,
            session_id=message.session_id,
            use_documents=False
        )
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Error processing general message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def list_chat_sessions():
    """List all chat sessions."""
    try:
        sessions = chat_service.list_sessions()
        return {"sessions": sessions, "total_count": len(sessions)}
    except Exception as e:
        logger.error(f"Error listing chat sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}")
async def get_chat_session(session_id: str):
    """Get a specific chat session."""
    try:
        session = chat_service.get_session_info(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str):
    """Delete a chat session."""
    try:
        success = chat_service.delete_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"message": "Session deleted successfully", "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions")
async def clear_all_sessions():
    """Clear all chat sessions."""
    try:
        count = chat_service.clear_all_sessions()
        return {"message": f"Cleared {count} chat sessions"}
    except Exception as e:
        logger.error(f"Error clearing chat sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suggestions")
async def get_suggested_questions(context: Optional[str] = None):
    """Get suggested questions based on context."""
    try:
        questions = await chat_service.get_suggested_questions(context)
        return {"suggestions": questions}
    except Exception as e:
        logger.error(f"Error getting suggested questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/overview")
async def get_chat_statistics():
    """Get chat service statistics."""
    try:
        stats = await chat_service.get_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error getting chat statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clear-cache")
async def clear_document_cache():
    """Clear document cache in chat service."""
    try:
        chat_service.clear_document_cache()
        return {"message": "Document cache cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing document cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
