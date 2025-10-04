from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Any, Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating text embeddings using Sentence Transformers."""
    
    def __init__(self):
        self.model = None
        self.model_name = "all-MiniLM-L6-v2"  # Fast and efficient model
        self._load_model()
    
    def _load_model(self):
        """Load the embedding model."""
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("Embedding model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load embedding model: {str(e)}")
            raise
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of embedding vectors
        """
        try:
            if not texts:
                return []
            
            # Generate embeddings
            embeddings = self.model.encode(
                texts,
                convert_to_tensor=False,
                show_progress_bar=len(texts) > 10
            )
            
            # Convert to list of lists
            if isinstance(embeddings, np.ndarray):
                embeddings = embeddings.tolist()
            
            logger.info(f"Generated embeddings for {len(texts)} texts")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            return []
    
    def generate_single_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector
        """
        try:
            embedding = self.model.encode([text], convert_to_tensor=False)
            
            if isinstance(embedding, np.ndarray):
                embedding = embedding.tolist()
            
            return embedding[0] if embedding else []
            
        except Exception as e:
            logger.error(f"Error generating single embedding: {str(e)}")
            return []
    
    def compute_similarity(self, text1: str, text2: str) -> float:
        """
        Compute similarity between two texts.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score (0-1)
        """
        try:
            embeddings = self.model.encode([text1, text2], convert_to_tensor=False)
            
            # Compute cosine similarity
            from sklearn.metrics.pairwise import cosine_similarity
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error computing similarity: {str(e)}")
            return 0.0
    
    def find_most_similar(self, query: str, texts: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Find most similar texts to a query.
        
        Args:
            query: Query text
            texts: List of texts to compare
            top_k: Number of top results to return
            
        Returns:
            List of similar texts with scores
        """
        try:
            if not texts:
                return []
            
            # Generate embeddings
            query_embedding = self.model.encode([query], convert_to_tensor=False)
            text_embeddings = self.model.encode(texts, convert_to_tensor=False)
            
            # Compute similarities
            from sklearn.metrics.pairwise import cosine_similarity
            similarities = cosine_similarity(query_embedding, text_embeddings)[0]
            
            # Get top k results
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                results.append({
                    'text': texts[idx],
                    'score': float(similarities[idx]),
                    'index': int(idx)
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error finding similar texts: {str(e)}")
            return []
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        try:
            return {
                'model_name': self.model_name,
                'embedding_dimension': self.model.get_sentence_embedding_dimension(),
                'max_sequence_length': self.model.max_seq_length,
                'device': str(self.model.device)
            }
        except Exception as e:
            logger.error(f"Error getting model info: {str(e)}")
            return {}
    
    def health_check(self) -> Dict[str, Any]:
        """Check embedding service health."""
        try:
            # Test with a simple embedding
            test_embedding = self.generate_single_embedding("test")
            
            return {
                'status': 'healthy',
                'model_loaded': self.model is not None,
                'embedding_dimension': len(test_embedding),
                'model_info': self.get_model_info()
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'model_loaded': self.model is not None
            }

# Global embedding service instance
embedding_service = EmbeddingService()
