import httpx
import json
import logging
import markdown
from typing import Dict, List, Optional, Any
from app.config import settings

logger = logging.getLogger(__name__)

class GroqClient:
    """Client for interacting with Groq API (Llama 3 70B)"""
    
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.base_url = settings.groq_api_url
        self.model = settings.groq_model
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def _convert_markdown_to_html(self, text: str) -> str:
        """Convert markdown text to HTML."""
        try:
            # Convert markdown to HTML
            html = markdown.markdown(text)
            return html
        except Exception as e:
            logger.error(f"Error converting markdown to HTML: {str(e)}")
            # Return original text if conversion fails
            return text.replace('\n', '<br>')
    
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int = 1000,
        temperature: float = 0.7,
        stream: bool = False
    ) -> str:
        """
        Generate response using Groq API (Llama 3 70B).
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            max_tokens: Maximum tokens in response
            temperature: Temperature for response generation
            stream: Whether to stream the response
            
        Returns:
            str: Generated response
        """
        try:
            payload = {
                "model": self.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": 1,
                "stream": stream
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                
                response.raise_for_status()
                data = response.json()
                
                if "choices" in data and len(data["choices"]) > 0:
                    response_text = data["choices"][0]["message"]["content"]
                    # Convert markdown to HTML
                    html_response = self._convert_markdown_to_html(response_text)
                    return html_response
                else:
                    logger.error("No choices in Groq API response")
                    return "I apologize, but I couldn't generate a response at this time."
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"Groq API HTTP error: {e.response.status_code} - {e.response.text}")
            return "I'm experiencing technical difficulties. Please try again later."
        except httpx.TimeoutException:
            logger.error("Groq API timeout")
            return "The request timed out. Please try again."
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            return "I encountered an error while processing your request."
    
    async def generate_response_stream(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int = 1000,
        temperature: float = 0.7
    ):
        """
        Generate streaming response using Groq API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            max_tokens: Maximum tokens in response
            temperature: Temperature for response generation
            
        Yields:
            str: Generated response chunks
        """
        try:
            payload = {
                "model": self.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": 1,
                "stream": True
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                ) as response:
                    response.raise_for_status()
                    
                    full_response = ""
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]  # Remove "data: " prefix
                            
                            if data_str.strip() == "[DONE]":
                                break
                                
                            try:
                                data = json.loads(data_str)
                                if "choices" in data and len(data["choices"]) > 0:
                                    choice = data["choices"][0]
                                    if "delta" in choice and "content" in choice["delta"]:
                                        content = choice["delta"]["content"]
                                        full_response += content
                                        yield content
                            except json.JSONDecodeError:
                                continue
                    
                    # Convert final response to HTML
                    if full_response:
                        html_response = self._convert_markdown_to_html(full_response)
                        yield f"__FINAL_HTML__{html_response}"
                        
        except httpx.HTTPStatusError as e:
            logger.error(f"Groq API HTTP error: {e.response.status_code} - {e.response.text}")
            yield "I'm experiencing technical difficulties. Please try again later."
        except httpx.TimeoutException:
            logger.error("Groq API timeout")
            yield "The request timed out. Please try again."
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            yield "I encountered an error while processing your request."
    
    async def generate_rag_response(
        self,
        query: str,
        context_chunks: List[str],
        max_tokens: int = 300  # Reduced default
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
        
        # Create RAG prompt optimized for Llama 3
        system_prompt = """You are a helpful legal assistant with access to uploaded legal documents. When answering questions, ALWAYS use the provided document context when it's relevant.

Guidelines:
- PRIORITIZE information from the uploaded documents
- Reference the documents when answering questions
- If the question can be answered using the document context, use it
- Keep responses conversational but informative
- Include brief disclaimers only for specific legal advice
- Remember: You have access to legal documents that the user has uploaded"""
        
        user_prompt = f"""Context from legal documents:
{context}

Question: {query}

Please respond briefly and naturally."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.generate_response(messages, max_tokens=max_tokens, temperature=0.1)
    
    async def generate_rag_response_stream(
        self,
        query: str,
        context_chunks: List[str],
        max_tokens: int = 300
    ):
        """
        Generate streaming RAG response using retrieved context.
        
        Args:
            query: User's question
            context_chunks: Retrieved document chunks
            max_tokens: Maximum tokens in response
            
        Yields:
            str: Generated response chunks
        """
        # Prepare context
        context = "\n\n".join(context_chunks[:5])  # Use top 5 chunks
        
        # Create RAG prompt optimized for Llama 3
        system_prompt = """You are a helpful legal assistant with access to uploaded legal documents. When answering questions, ALWAYS use the provided document context when it's relevant.

Guidelines:
- PRIORITIZE information from the uploaded documents
- Reference the documents when answering questions
- If the question can be answered using the document context, use it
- Keep responses conversational but informative
- Include brief disclaimers only for specific legal advice
- Remember: You have access to legal documents that the user has uploaded"""
        
        user_prompt = f"""Context from legal documents:
{context}

Question: {query}

Please respond briefly and naturally."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        async for chunk in self.generate_response_stream(messages, max_tokens=max_tokens, temperature=0.1):
            yield chunk

    async def generate_general_response(self, query: str, max_tokens: int = 300) -> str:
        """
        Generate response for general legal queries without specific document context.
        
        Args:
            query: User's question
            max_tokens: Maximum tokens in response
            
        Returns:
            str: Generated response
        """
        system_prompt = """You are a helpful and friendly legal assistant. Your name is "Legal Assistant" and you help with legal questions and document analysis. Respond naturally and briefly to all types of questions and messages.

Guidelines:
- When someone greets you or asks who you are, introduce yourself as a legal assistant
- Keep all responses short and conversational
- Be friendly and natural in your tone
- For legal questions, provide clear brief information
- Include a brief disclaimer only when giving specific legal advice"""
        
        user_prompt = f"""Please respond to: {query}

Keep your response brief and natural."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.generate_response(messages, max_tokens=max_tokens, temperature=0.3)
    
    async def generate_general_response_stream(self, query: str, max_tokens: int = 300):
        """
        Generate streaming response for general queries without specific document context.
        
        Args:
            query: User's question
            max_tokens: Maximum tokens in response
            
        Yields:
            str: Generated response chunks
        """
        system_prompt = """You are a helpful and friendly legal assistant. Your name is "Legal Assistant" and you help with legal questions and document analysis. Respond naturally and briefly to all types of questions and messages.

Guidelines:
- When someone greets you or asks who you are, introduce yourself as a legal assistant
- Keep all responses short and conversational
- Be friendly and natural in your tone
- For legal questions, provide clear brief information
- Include a brief disclaimer only when giving specific legal advice"""
        
        user_prompt = f"""Please respond to: {query}

Keep your response brief and natural."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        async for chunk in self.generate_response_stream(messages, max_tokens=max_tokens, temperature=0.3):
            yield chunk

    async def test_connection(self) -> bool:
        """Test if Groq API is accessible."""
        try:
            messages = [{"role": "user", "content": "Hello, this is a test message. Please respond briefly."}]
            response = await self.generate_response(messages, max_tokens=50)
            return bool(response and len(response) > 0)
        except Exception as e:
            logger.error(f"Groq API connection test failed: {str(e)}")
            return False
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model."""
        try:
            # Test connection and get basic info
            connection_ok = await self.test_connection()
            
            return {
                "model": self.model,
                "provider": "Groq",
                "base_url": self.base_url,
                "connection_status": "connected" if connection_ok else "disconnected",
                "description": "Llama 3 70B - High-performance language model optimized for speed"
            }
        except Exception as e:
            logger.error(f"Error getting model info: {str(e)}")
            return {
                "model": self.model,
                "provider": "Groq",
                "connection_status": "error",
                "error": str(e)
            }

# Global Groq client instance
groq_client = GroqClient()
