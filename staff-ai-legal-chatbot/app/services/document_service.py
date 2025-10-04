import os
import uuid
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime
from fastapi import UploadFile, HTTPException

from app.utils.ocr_utils import extract_text_from_file
from app.utils.text_utils import chunk_text, preprocess_text, extract_metadata, is_meaningful_text
from app.utils.file_utils import save_uploaded_file, delete_file, get_file_size
from app.services.embedding_service import embedding_service
from app.database import chroma_manager
from app.config import settings

logger = logging.getLogger(__name__)

class DocumentProcessingService:
    """Service for processing and storing documents."""
    
    def __init__(self):
        self.processed_documents = {}  # In-memory storage for document info
    
    async def process_document(self, file: UploadFile, file_id: str = None) -> Dict[str, Any]:
        """
        Process uploaded document: extract text, chunk, embed, and store.
        
        Args:
            file: Uploaded file
            file_id: Optional file ID (generates new if not provided)
            
        Returns:
            Dictionary with processing results
        """
        if file_id is None:
            file_id = str(uuid.uuid4())
        
        file_path = None
        try:
            # Save uploaded file
            file_path = await save_uploaded_file(file, file_id)
            
            # Extract text from file
            logger.info(f"Processing document: {file.filename}")
            text = extract_text_from_file(file_path)
            
            if not text or not is_meaningful_text(text):
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract meaningful text from the document"
                )
            
            # Preprocess text
            processed_text = preprocess_text(text)
            
            # Extract metadata
            metadata = extract_metadata(processed_text, file.filename)
            metadata.update({
                'file_id': file_id,
                'upload_date': datetime.now().isoformat(),
                'file_size': get_file_size(file_path),
                'processing_status': 'processing'
            })
            
            # Chunk the text
            chunks = chunk_text(
                processed_text,
                chunk_size=settings.chunk_size,
                chunk_overlap=settings.chunk_overlap
            )
            
            # Limit chunks if necessary
            if len(chunks) > settings.max_chunks_per_document:
                chunks = chunks[:settings.max_chunks_per_document]
                logger.warning(f"Limited chunks to {settings.max_chunks_per_document} for document {file.filename}")
            
            # Generate embeddings and store in ChromaDB
            success = await self._store_document_chunks(
                chunks=chunks,
                base_metadata=metadata,
                file_id=file_id
            )
            
            if not success:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to store document in database"
                )
            
            # Update processing status
            metadata['processing_status'] = 'completed'
            metadata['chunk_count'] = len(chunks)
            
            # Store document info
            self.processed_documents[file_id] = {
                'filename': file.filename,
                'file_id': file_id,
                'upload_date': metadata['upload_date'],
                'file_size': metadata['file_size'],
                'chunk_count': len(chunks),
                'status': 'completed',
                'metadata': metadata
            }
            
            logger.info(f"Successfully processed document: {file.filename} ({len(chunks)} chunks)")
            
            return {
                'file_id': file_id,
                'filename': file.filename,
                'status': 'completed',
                'message': 'Document processed successfully',
                'chunks_created': len(chunks),
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"Error processing document {file.filename}: {str(e)}")
            
            # Update status to failed
            if file_id in self.processed_documents:
                self.processed_documents[file_id]['status'] = 'failed'
            
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process document: {str(e)}"
            )
        
        finally:
            # Clean up uploaded file
            if file_path and os.path.exists(file_path):
                delete_file(file_path)
    
    async def _store_document_chunks(
        self,
        chunks: List[str],
        base_metadata: Dict[str, Any],
        file_id: str
    ) -> bool:
        """
        Store document chunks in ChromaDB with embeddings.
        
        Args:
            chunks: List of text chunks
            base_metadata: Base metadata for all chunks
            file_id: File identifier
            
        Returns:
            bool: True if successful
        """
        try:
            # Generate embeddings for all chunks
            logger.info(f"Generating embeddings for {len(chunks)} chunks")
            embeddings = embedding_service.generate_embeddings(chunks)
            
            if not embeddings or len(embeddings) != len(chunks):
                logger.error("Failed to generate embeddings for all chunks")
                return False
            
            # Prepare data for ChromaDB
            chunk_ids = []
            chunk_metadatas = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{file_id}_chunk_{i}"
                chunk_metadata = base_metadata.copy()
                chunk_metadata.update({
                    'chunk_id': chunk_id,
                    'chunk_index': i,
                    'chunk_text_length': len(chunk),
                    'chunk_word_count': len(chunk.split())
                })
                
                chunk_ids.append(chunk_id)
                chunk_metadatas.append(chunk_metadata)
            
            # Store in ChromaDB
            success = chroma_manager.add_documents(
                documents=chunks,
                metadatas=chunk_metadatas,
                ids=chunk_ids
            )
            
            if success:
                logger.info(f"Successfully stored {len(chunks)} chunks in ChromaDB")
            
            return success
            
        except Exception as e:
            logger.error(f"Error storing document chunks: {str(e)}")
            return False
    
    def get_document_info(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a processed document."""
        return self.processed_documents.get(file_id)
    
    def list_documents(self) -> List[Dict[str, Any]]:
        """List all processed documents."""
        return list(self.processed_documents.values())
    
    def delete_document(self, file_id: str) -> bool:
        """
        Delete a document and all its chunks.
        
        Args:
            file_id: File identifier
            
        Returns:
            bool: True if successful
        """
        try:
            # Get document chunks from ChromaDB
            document_info = self.get_document_info(file_id)
            if not document_info:
                return False
            
            # Find all chunk IDs for this document
            chunk_ids = []
            chunk_count = document_info.get('chunk_count', 0)
            
            for i in range(chunk_count):
                chunk_ids.append(f"{file_id}_chunk_{i}")
            
            # Delete from ChromaDB
            success = chroma_manager.delete_documents(chunk_ids)
            
            if success:
                # Remove from in-memory storage
                if file_id in self.processed_documents:
                    del self.processed_documents[file_id]
                
                # Clear chat service document cache to force refresh
                try:
                    from app.services.chat_service import chat_service
                    chat_service.clear_document_cache()
                except ImportError:
                    pass  # Chat service not available
                
                logger.info(f"Successfully deleted document: {file_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting document {file_id}: {str(e)}")
            return False
    
    def search_documents(
        self,
        query: str,
        n_results: int = 5,
        filter_by_file: str = None
    ) -> Dict[str, Any]:
        """
        Search for relevant document chunks.
        
        Args:
            query: Search query
            n_results: Number of results to return
            filter_by_file: Optional file ID filter
            
        Returns:
            Search results
        """
        try:
            # Check if there are any documents available
            doc_count = chroma_manager.get_document_count()
            if doc_count == 0:
                logger.info("No documents available in the database")
                return {
                    'query': query,
                    'results': [],
                    'total_results': 0,
                    'message': 'No documents available in the database'
                }
            
            # Prepare metadata filter
            metadata_filter = None
            if filter_by_file:
                metadata_filter = {"file_id": filter_by_file}
            
            # Search in ChromaDB
            results = chroma_manager.search_documents(
                query=query,
                n_results=n_results,
                filter_metadata=metadata_filter
            )
            
            # Format results
            formatted_results = []
            for i, doc in enumerate(results['documents']):
                formatted_results.append({
                    'text': doc,
                    'metadata': results['metadatas'][i],
                    'score': 1 - results['distances'][i],  # Convert distance to similarity
                    'chunk_id': results['ids'][i]
                })
            
            return {
                'query': query,
                'results': formatted_results,
                'total_results': len(formatted_results)
            }
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            return {
                'query': query,
                'results': [],
                'total_results': 0,
                'error': str(e)
            }
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get processing statistics."""
        try:
            total_documents = len(self.processed_documents)
            total_chunks = chroma_manager.get_document_count()
            
            status_counts = {}
            for doc in self.processed_documents.values():
                status = doc['status']
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return {
                'total_documents': total_documents,
                'total_chunks': total_chunks,
                'status_breakdown': status_counts,
                'database_health': chroma_manager.health_check(),
                'embedding_service_health': embedding_service.health_check()
            }
            
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            return {
                'error': str(e),
                'total_documents': 0,
                'total_chunks': 0
            }
    
    def clear_all_documents(self) -> bool:
        """
        Clear all documents from the database and in-memory storage.
        
        Returns:
            bool: True if successful
        """
        try:
            # Reset ChromaDB collection
            success = chroma_manager.reset_collection()
            
            if success:
                # Clear in-memory storage
                self.processed_documents.clear()
                
                # Clear chat service document cache to force refresh
                try:
                    from app.services.chat_service import chat_service
                    chat_service.clear_document_cache()
                except ImportError:
                    pass  # Chat service not available
                
                logger.info("Successfully cleared all documents")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error clearing all documents: {str(e)}")
            return False

# Global document processing service instance
document_processor = DocumentProcessingService()
