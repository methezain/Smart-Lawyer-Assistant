from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime

from app.config import settings
from app.api import chat, documents
from app.models.schemas import HealthCheck

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="RAG Legal Chatbot API",
    description="A Retrieval-Augmented Generation chatbot for legal queries using Groq (Llama 3 70B)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(chat.router)
app.include_router(documents.router)

@app.get("/", response_model=HealthCheck)
async def root():
    """Root endpoint with basic API information."""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        database_status="connected"
    )

@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint."""
    try:
        # Check database connection
        from app.database import chroma_manager
        db_health = chroma_manager.health_check()
        
        # Check Groq API connection
        from app.services.groq_client import groq_client
        groq_status = await groq_client.test_connection()
        
        # Check embedding service
        from app.services.embedding_service import embedding_service
        embedding_health = embedding_service.health_check()
        
        status = "healthy" if (
            db_health['status'] == 'healthy' and 
            groq_status and 
            embedding_health['status'] == 'healthy'
        ) else "unhealthy"
        
        return HealthCheck(
            status=status,
            timestamp=datetime.now(),
            version="1.0.0",
            database_status=db_health['status']
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthCheck(
            status="unhealthy",
            timestamp=datetime.now(),
            version="1.0.0",
            database_status="error"
        )

@app.get("/info")
async def get_api_info():
    """Get detailed API information."""
    try:
        from app.database import chroma_manager
        from app.services.groq_client import groq_client
        from app.services.embedding_service import embedding_service
        from app.services.document_service import document_processor
        from app.services.chat_service import chat_service
        
        # Get component information
        db_health = chroma_manager.health_check()
        model_info = await groq_client.get_model_info()
        embedding_info = embedding_service.get_model_info()
        doc_stats = document_processor.get_statistics()
        chat_stats = await chat_service.get_statistics()
        
        return {
            "api": {
                "name": "RAG Legal Chatbot API",
                "version": "1.0.0",
                "description": "Groq-powered legal assistant with document processing",
            },
            "components": {
                "llm": model_info,
                "database": db_health,
                "embeddings": embedding_info,
                "documents": {
                    "total_documents": doc_stats.get('total_documents', 0),
                    "total_chunks": doc_stats.get('total_chunks', 0)
                },
                "chat": {
                    "total_sessions": chat_stats.get('total_sessions', 0),
                    "total_messages": chat_stats.get('total_messages', 0)
                }
            },
            "configuration": {
                "max_file_size": settings.max_file_size,
                "allowed_extensions": settings.allowed_extensions,
                "chunk_size": settings.chunk_size,
                "chunk_overlap": settings.chunk_overlap
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting API info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get API information")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred",
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port, #8014
        reload=True,
        log_level=settings.log_level.lower()
    )
