import chromadb
from chromadb.config import Settings
import logging
from typing import List, Dict, Optional, Any
from app.config import settings
import os

logger = logging.getLogger(__name__)

class ChromaDBManager:
    """Manages ChromaDB operations for document storage and retrieval."""
    
    def __init__(self):
        self.client = None
        self.collection = None
        self.collection_name = settings.chroma_collection_name
        self.db_path = settings.chroma_db_path
        self._initialize_db()
    
    def _initialize_db(self):
        """Initialize ChromaDB client and collection."""
        try:
            # Ensure the database directory exists
            os.makedirs(self.db_path, exist_ok=True)
            
            # Create ChromaDB client with persistent storage
            self.client = chromadb.PersistentClient(
                path=self.db_path,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity
            )
            
            logger.info(f"ChromaDB initialized successfully. Collection: {self.collection_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {str(e)}")
            raise
    
    def add_documents(
        self, 
        documents: List[str], 
        metadatas: List[Dict[str, Any]], 
        ids: List[str]
    ) -> bool:
        """
        Add documents to the collection.
        
        Args:
            documents: List of document chunks
            metadatas: List of metadata dictionaries
            ids: List of unique document IDs
            
        Returns:
            bool: True if successful
        """
        try:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Added {len(documents)} documents to collection")
            return True
            
        except Exception as e:
            logger.error(f"Error adding documents to ChromaDB: {str(e)}")
            return False
    
    def search_documents(
        self, 
        query: str, 
        n_results: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Search for similar documents.
        
        Args:
            query: Search query
            n_results: Number of results to return
            filter_metadata: Optional metadata filter
            
        Returns:
            Dict containing search results
        """
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=filter_metadata
            )
            
            logger.info(f"Search completed. Found {len(results['documents'][0])} results")
            return {
                'documents': results['documents'][0],
                'metadatas': results['metadatas'][0],
                'distances': results['distances'][0],
                'ids': results['ids'][0]
            }
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            return {
                'documents': [],
                'metadatas': [],
                'distances': [],
                'ids': []
            }
    
    def get_document_count(self) -> int:
        """Get total number of documents in collection."""
        try:
            return self.collection.count()
        except Exception as e:
            logger.error(f"Error getting document count: {str(e)}")
            return 0
    
    def delete_documents(self, ids: List[str]) -> bool:
        """
        Delete documents by IDs.
        
        Args:
            ids: List of document IDs to delete
            
        Returns:
            bool: True if successful
        """
        try:
            self.collection.delete(ids=ids)
            logger.info(f"Deleted {len(ids)} documents")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting documents: {str(e)}")
            return False
    
    def get_documents_by_file(self, filename: str) -> List[Dict[str, Any]]:
        """
        Get all documents from a specific file.
        
        Args:
            filename: Name of the file
            
        Returns:
            List of documents with metadata
        """
        try:
            results = self.collection.get(
                where={"filename": filename}
            )
            
            documents = []
            for i, doc in enumerate(results['documents']):
                documents.append({
                    'id': results['ids'][i],
                    'document': doc,
                    'metadata': results['metadatas'][i]
                })
            
            return documents
            
        except Exception as e:
            logger.error(f"Error getting documents by file: {str(e)}")
            return []
    
    def update_document_metadata(self, doc_id: str, metadata: Dict[str, Any]) -> bool:
        """
        Update metadata for a specific document.
        
        Args:
            doc_id: Document ID
            metadata: New metadata
            
        Returns:
            bool: True if successful
        """
        try:
            self.collection.update(
                ids=[doc_id],
                metadatas=[metadata]
            )
            logger.info(f"Updated metadata for document {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating document metadata: {str(e)}")
            return False
    
    def reset_collection(self) -> bool:
        """Reset the collection (delete all documents)."""
        try:
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Collection reset successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error resetting collection: {str(e)}")
            return False
    
    def health_check(self) -> Dict[str, Any]:
        """Check database health."""
        try:
            count = self.get_document_count()
            return {
                'status': 'healthy',
                'document_count': count,
                'collection_name': self.collection_name,
                'db_path': self.db_path
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'collection_name': self.collection_name,
                'db_path': self.db_path
            }

# Global ChromaDB manager instance
chroma_manager = ChromaDBManager()
