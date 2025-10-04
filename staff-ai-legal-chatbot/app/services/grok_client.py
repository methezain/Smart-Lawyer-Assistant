import httpx
import json
import logging
from typing import Dict, List, Optional, Any
from app.config import settings

logger = logging.getLogger(__name__)

class GrokClient:
    """Client for interacting with Grok API"""
    
    def __init__(self):
        self.api_key = settings.grok_api_key
        self.base_url = settings.grok_api_url
        self.model = settings.grok_model
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Generate response using Grok API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            max_tokens: Maximum tokens in response
            temperature: Temperature for response generation
            
        Returns:
            str: Generated response
        """
        try:
            payload = {
                "model": self.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": False
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0
                )
                
                response.raise_for_status()
                data = response.json()
                
                if "choices" in data and len(data["choices"]) > 0:
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.error("No choices in Grok API response")
                    return "I apologize, but I couldn't generate a response at this time."
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"Grok API HTTP error: {e.response.status_code} - {e.response.text}")
            return "I'm experiencing technical difficulties. Please try again later."
        except httpx.TimeoutException:
            logger.error("Grok API timeout")
            return "The request timed out. Please try again."
        except Exception as e:
            logger.error(f"Grok API error: {str(e)}")
            return "I encountered an error while processing your request."
    
    async def generate_rag_response(
        self,
        query: str,
        context_chunks: List[str],
        max_tokens: int = 1000
    ) -> str:
        """
        Generate RAG response using retrieved context.
        
        Args:
            query: User's question
            context_chunks: Retrieved document chunks
            max_tokens: Maximum tokens in response
            
        Returns:
            str: Generated response with context
        """
        # Prepare context
        context = "\n\n".join(context_chunks[:5])  # Use top 5 chunks
        
        # Create RAG prompt
        system_prompt = """You are a helpful legal assistant. Use the provided context to answer the user's question about law. 
        If the context doesn't contain relevant information, say so and provide general legal guidance when appropriate.
        Always be accurate and cite when you're referencing the provided documents."""
        
        user_prompt = f"""Context from uploaded documents:
        {context}
        
        Question: {query}
        
        Please provide a comprehensive answer based on the context above."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.generate_response(messages, max_tokens=max_tokens, temperature=0.3)
    
    async def generate_general_response(self, query: str, max_tokens: int = 1000) -> str:
        """
        Generate response for general legal queries without specific context.
        
        Args:
            query: User's question
            max_tokens: Maximum tokens in response
            
        Returns:
            str: Generated response
        """
        system_prompt = """You are a knowledgeable legal assistant. Provide helpful, accurate information about legal topics.
        Always include appropriate disclaimers that your responses are for informational purposes only and not legal advice.
        Encourage users to consult with qualified legal professionals for specific legal matters."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]
        
        return await self.generate_response(messages, max_tokens=max_tokens, temperature=0.4)
    
    async def test_connection(self) -> bool:
        """Test if Grok API is accessible."""
        try:
            messages = [{"role": "user", "content": "Hello, this is a test message."}]
            response = await self.generate_response(messages, max_tokens=10)
            return bool(response and len(response) > 0)
        except Exception as e:
            logger.error(f"Grok API connection test failed: {str(e)}")
            return False

# Global Grok client instance
grok_client = GrokClient()
