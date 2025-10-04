from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
import uuid

from app.services.groq_client import groq_client
from app.services.document_service import document_processor
from app.database import chroma_manager
from app.config import settings
from app.models.schemas import DocumentSource

logger = logging.getLogger(__name__)

class ChatService:
    """Service for handling chat interactions with RAG capabilities."""
    
    def __init__(self):
        self.chat_sessions = {}  # In-memory storage for chat sessions
        self._document_cache_timestamp = None  # Track when document cache was last updated
    
    async def process_chat_message(
        self,
        message: str,
        session_id: str = None,
        use_documents: bool = True,
        n_context_docs: int = 5
    ) -> Dict[str, Any]:
        """
        Process a chat message with RAG capabilities.
        
        Args:
            message: User's message
            session_id: Optional session ID
            use_documents: Whether to use RAG with documents
            n_context_docs: Number of context documents to retrieve
            
        Returns:
            Chat response dictionary
        """
        try:
            # Generate session ID if not provided
            if session_id is None:
                session_id = str(uuid.uuid4())
            
            # Initialize session if new
            if session_id not in self.chat_sessions:
                self.chat_sessions[session_id] = {
                    'messages': [],
                    'created_at': datetime.now().isoformat(),
                    'last_activity': datetime.now().isoformat()
                }
            
            # Update session activity
            self.chat_sessions[session_id]['last_activity'] = datetime.now().isoformat()
            
            # Add user message to session
            self.chat_sessions[session_id]['messages'].append({
                'role': 'user',
                'content': message,
                'timestamp': datetime.now().isoformat()
            })
            
            # Determine response type
            if use_documents and self._should_use_rag(message):
                response_data = await self._generate_rag_response(
                    message=message,
                    session_id=session_id,
                    n_context_docs=n_context_docs
                )
            else:
                response_data = await self._generate_general_response(
                    message=message,
                    session_id=session_id
                )
            
            # Add assistant response to session
            self.chat_sessions[session_id]['messages'].append({
                'role': 'assistant',
                'content': response_data['response'],
                'timestamp': datetime.now().isoformat(),
                'sources': response_data.get('sources', [])
            })
            
            return response_data
            
        except Exception as e:
            logger.error(f"Error processing chat message: {str(e)}")
            return {
                'response': "I apologize, but I encountered an error while processing your message. Please try again.",
                'sources': [],
                'session_id': session_id,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    async def _generate_rag_response(
        self,
        message: str,
        session_id: str,
        n_context_docs: int
    ) -> Dict[str, Any]:
        """Generate response using RAG (Retrieval-Augmented Generation)."""
        try:
            # Double-check that documents are still available
            if not self._validate_document_availability():
                logger.info("No documents available in database, using general response")
                return await self._generate_general_response(message, session_id)
            
            # Search for relevant documents
            search_results = document_processor.search_documents(
                query=message,
                n_results=n_context_docs
            )
            
            if not search_results['results']:
                # No relevant documents found, fall back to general response
                logger.info("No relevant documents found, using general response")
                return await self._generate_general_response(message, session_id)
            
            # Extract context from search results
            context_chunks = []
            sources = []
            
            for result in search_results['results']:
                context_chunks.append(result['text'])
                
                # Add source information
                metadata = result['metadata']
                source_info = DocumentSource(
                    filename=metadata.get('filename', 'Unknown'),
                    chunk_id=result['chunk_id'],
                    score=result['score'],
                    file_id=metadata.get('file_id', 'Unknown')
                )
                sources.append(source_info)
            
            # Generate response using Groq with context
            response = await groq_client.generate_rag_response(
                query=message,
                context_chunks=context_chunks,
                max_tokens=300  # Reduced for shorter responses
            )
            
            logger.info(f"Generated RAG response using {len(context_chunks)} context chunks")
            
            return {
                'response': response,
                'sources': sources,
                'session_id': session_id,
                'timestamp': datetime.now().isoformat(),
                'response_type': 'rag',
                'context_used': len(context_chunks)
            }
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {str(e)}")
            # Fall back to general response
            return await self._generate_general_response(message, session_id)
    
    async def _generate_general_response(
        self,
        message: str,
        session_id: str
    ) -> Dict[str, Any]:
        """Generate general response without document context."""
        try:
            # Get conversation history for context
            conversation_history = self._get_conversation_history(session_id, limit=5)
            
            # Generate response using Groq
            response = await groq_client.generate_general_response(
                query=message,
                max_tokens=300  # Reduced for shorter responses
            )
            
            logger.info("Generated general response")
            
            return {
                'response': response,
                'sources': [],
                'session_id': session_id,
                'timestamp': datetime.now().isoformat(),
                'response_type': 'general'
            }
            
        except Exception as e:
            logger.error(f"Error generating general response: {str(e)}")
            return {
                'response': "I apologize, but I'm having trouble generating a response right now. Please try again later.",
                'sources': [],
                'session_id': session_id,
                'timestamp': datetime.now().isoformat(),
                'response_type': 'error',
                'error': str(e)
            }
    
    async def _generate_general_response_stream(
        self,
        message: str,
        session_id: str
    ):
        """Generate streaming general response without document context."""
        try:
            # Generate streaming response using Groq
            full_response = ""
            async for chunk in groq_client.generate_general_response_stream(
                query=message,
                max_tokens=300
            ):
                if chunk.startswith("__FINAL_HTML__"):
                    # Final HTML version
                    html_response = chunk[14:]  # Remove "__FINAL_HTML__" prefix
                    yield {
                        'type': 'final',
                        'content': html_response,
                        'session_id': session_id,
                        'timestamp': datetime.now().isoformat(),
                        'response_type': 'general'
                    }
                else:
                    # Stream chunk
                    full_response += chunk
                    yield {
                        'type': 'chunk',
                        'content': chunk,
                        'session_id': session_id,
                        'timestamp': datetime.now().isoformat()
                    }
            
            # Add assistant message to session
            self.chat_sessions[session_id]['messages'].append({
                'role': 'assistant',
                'content': full_response,
                'timestamp': datetime.now().isoformat(),
                'response_type': 'general'
            })
            
            logger.info("Generated streaming general response")
            
        except Exception as e:
            logger.error(f"Error generating streaming general response: {str(e)}")
            import traceback
            traceback.print_exc()
            yield {
                'type': 'error',
                'content': f"I apologize, but I'm having trouble generating a response: {str(e)}",
                'session_id': session_id,
                'timestamp': datetime.now().isoformat()
            }
    
    def _should_use_rag(self, message: str) -> bool:
        """
        Determine if RAG should be used based on the message content.
        
        Args:
            message: User's message
            
        Returns:
            bool: True if RAG should be used
        """
        # Check if there are any documents in the database
        if not self._validate_document_availability():
            return False
        
        message_lower = message.lower().strip()
        
        # Don't use RAG for basic greetings
        basic_greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'thanks', 'thank you', 'bye', 'goodbye']
        if message_lower in basic_greetings:
            return False
        
        # Keywords that suggest the user wants to refer to uploaded documents
        document_keywords = [
            'document', 'documents', 'uploaded', 'file', 'files', 'case', 'cases',
            'petition', 'court', 'order', 'judgment', 'ruling', 'legal document',
            'attached', 'attachment', 'pdf', 'text', 'content', 'mention', 'mentioned',
            'says', 'states', 'according to', 'based on', 'in the document',
            'what does', 'summarize', 'summary', 'extract', 'find', 'search',
            'show me', 'tell me about', 'explain from', 'from the'
        ]
        
        # Keywords that suggest general legal knowledge queries (not document-specific)
        general_keywords = [
            'what is', 'define', 'definition', 'explain', 'how does', 'why is',
            'criminology', 'law in general', 'legal concept', 'legal principle',
            'in law', 'legal theory', 'jurisprudence', 'legal system',
            'generally', 'typically', 'usually', 'common law', 'statute',
            'legislation', 'legal education', 'study of law'
        ]
        
        # Check if the message contains document-related keywords
        contains_document_keywords = any(keyword in message_lower for keyword in document_keywords)
        
        # Check if the message contains general knowledge keywords
        contains_general_keywords = any(keyword in message_lower for keyword in general_keywords)
        
        # If the message clearly refers to documents, use RAG
        if contains_document_keywords:
            return True
        
        # If the message is asking for general legal knowledge, don't use RAG
        if contains_general_keywords:
            return False
        
        # For ambiguous cases, do a quick relevance check by searching documents
        # If we find relevant results (good similarity score), use RAG
        try:
            search_results = document_processor.search_documents(
                query=message,
                n_results=1
            )
            
            if search_results['results'] and len(search_results['results']) > 0:
                # Check if the best result has a good similarity score
                best_score = search_results['results'][0]['score']
                # Use a higher threshold - if similarity is above 0.5, consider it relevant
                # This ensures we only use RAG when documents are actually relevant
                if best_score > 0.5:
                    # Double-check that documents still exist in the database
                    if self._validate_document_availability():
                        return True
            
            # If no relevant documents found, use general response
            return False
            
        except Exception as e:
            logger.error(f"Error checking document relevance: {str(e)}")
            # If there's an error, default to general response for safety
            return False
    
    def _get_conversation_history(self, session_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent conversation history for context."""
        if session_id not in self.chat_sessions:
            return []
        
        messages = self.chat_sessions[session_id]['messages']
        return messages[-limit:] if len(messages) > limit else messages
    
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a chat session."""
        session = self.chat_sessions.get(session_id)
        if not session:
            return None
        
        return {
            'session_id': session_id,
            'created_at': session['created_at'],
            'last_activity': session['last_activity'],
            'message_count': len(session['messages']),
            'messages': session['messages']
        }
    
    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all chat sessions."""
        sessions = []
        for session_id, session_data in self.chat_sessions.items():
            sessions.append({
                'session_id': session_id,
                'created_at': session_data['created_at'],
                'last_activity': session_data['last_activity'],
                'message_count': len(session_data['messages'])
            })
        return sessions
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a chat session."""
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id]
            logger.info(f"Deleted chat session: {session_id}")
            return True
        return False
    
    def clear_all_sessions(self) -> int:
        """Clear all chat sessions."""
        count = len(self.chat_sessions)
        self.chat_sessions.clear()
        logger.info(f"Cleared {count} chat sessions")
        return count
    
    async def get_suggested_questions(self, context: str = None) -> List[str]:
        """Generate suggested questions based on context or general legal topics."""
        try:
            if context:
                # Generate questions based on document context
                prompt = f"""Based on the following legal document context, suggest 3-5 relevant questions a user might ask:

Context: {context[:500]}...

Generate specific, actionable questions that would help users understand the legal content better."""
            else:
                # Generate general legal questions
                prompt = """Generate 5 common legal questions that users typically ask about law. Make them diverse and cover different areas of law."""
            
            response = await groq_client.generate_general_response(
                query=prompt,
                max_tokens=200
            )
            
            # Parse the response to extract questions
            questions = []
            for line in response.split('\n'):
                line = line.strip()
                if line and ('?' in line or line.startswith(('What', 'How', 'Why', 'When', 'Where', 'Can', 'Is', 'Are', 'Do', 'Does'))):
                    questions.append(line)
            
            return questions[:5]  # Return max 5 questions
            
        except Exception as e:
            logger.error(f"Error generating suggested questions: {str(e)}")
            return [
                "What are the key legal principles I should know?",
                "How do I understand legal documents?",
                "What are my rights in this situation?",
                "What legal steps should I take?",
                "How do I find relevant legal information?"
            ]
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get chat service statistics."""
        try:
            total_sessions = len(self.chat_sessions)
            total_messages = sum(len(session['messages']) for session in self.chat_sessions.values())
            
            # Count messages by type
            message_types = {'user': 0, 'assistant': 0}
            response_types = {'rag': 0, 'general': 0, 'error': 0}
            
            for session in self.chat_sessions.values():
                for message in session['messages']:
                    role = message.get('role', 'unknown')
                    if role in message_types:
                        message_types[role] += 1
                    
                    # Count response types for assistant messages
                    if role == 'assistant':
                        sources = message.get('sources', [])
                        if sources:
                            response_types['rag'] += 1
                        else:
                            response_types['general'] += 1
            
            return {
                'total_sessions': total_sessions,
                'total_messages': total_messages,
                'message_types': message_types,
                'response_types': response_types,
                'groq_api_status': await groq_client.test_connection()
            }
            
        except Exception as e:
            logger.error(f"Error getting chat statistics: {str(e)}")
            return {
                'error': str(e),
                'total_sessions': 0,
                'total_messages': 0
            }
    
    async def process_chat_message_stream(
        self,
        message: str,
        session_id: str = None,
        use_documents: bool = True,
        n_context_docs: int = 5
    ):
        """
        Process a chat message with streaming response.
        
        Args:
            message: User's message
            session_id: Optional session ID
            use_documents: Whether to use RAG with documents
            n_context_docs: Number of context documents to retrieve
            
        Yields:
            Dict: Chat response chunks
        """
        try:
            # Generate session ID if not provided
            if session_id is None:
                session_id = str(uuid.uuid4())
            
            # Initialize session if new
            if session_id not in self.chat_sessions:
                self.chat_sessions[session_id] = {
                    'messages': [],
                    'created_at': datetime.now().isoformat(),
                    'last_activity': datetime.now().isoformat()
                }
            
            # Add user message to session
            self.chat_sessions[session_id]['messages'].append({
                'role': 'user',
                'content': message,
                'timestamp': datetime.now().isoformat()
            })
            
            # Update last activity
            self.chat_sessions[session_id]['last_activity'] = datetime.now().isoformat()
            
            # Determine response type and generate streaming response
            if use_documents and self._should_use_rag(message):
                async for chunk in self._generate_rag_response_stream(message, session_id, n_context_docs):
                    yield chunk
            else:
                async for chunk in self._generate_general_response_stream(message, session_id):
                    yield chunk
                    
        except Exception as e:
            logger.error(f"Error processing streaming chat message: {str(e)}")
            yield {
                'type': 'error',
                'content': "I apologize, but I'm having trouble generating a response right now. Please try again later.",
                'session_id': session_id,
                'timestamp': datetime.now().isoformat()
            }

    async def _generate_rag_response_stream(
        self,
        message: str,
        session_id: str,
        n_context_docs: int = 5
    ):
        """Generate streaming response using RAG (Retrieval-Augmented Generation)."""
        try:
            # Double-check that documents are still available
            if not self._validate_document_availability():
                logger.info("No documents available in database, using general response")
                async for chunk in self._generate_general_response_stream(message, session_id):
                    yield chunk
                return
            
            # Search for relevant documents
            search_results = document_processor.search_documents(
                query=message,
                n_results=n_context_docs
            )
            
            if not search_results['results']:
                # No relevant documents found, fall back to general response
                logger.info("No relevant documents found, using general response")
                async for chunk in self._generate_general_response_stream(message, session_id):
                    yield chunk
                return
            
            # Extract context from search results
            context_chunks = []
            sources = []
            
            for result in search_results['results']:
                context_chunks.append(result['text'])
                
                # Add source information
                metadata = result['metadata']
                source_info = DocumentSource(
                    filename=metadata.get('filename', 'Unknown'),
                    chunk_id=result['chunk_id'],
                    score=result['score'],
                    file_id=metadata.get('file_id', 'Unknown')
                )
                sources.append(source_info)
            
            # Send sources first
            sources_dict = [source.dict() for source in sources]
            yield {
                'type': 'sources',
                'content': sources_dict,
                'session_id': session_id,
                'timestamp': datetime.now().isoformat()
            }
            
            # Generate streaming response using Groq with context
            full_response = ""
            async for chunk in groq_client.generate_rag_response_stream(
                query=message,
                context_chunks=context_chunks,
                max_tokens=300
            ):
                if chunk.startswith("__FINAL_HTML__"):
                    # Final HTML version
                    html_response = chunk[14:]  # Remove "__FINAL_HTML__" prefix
                    yield {
                        'type': 'final',
                        'content': html_response,
                        'session_id': session_id,
                        'timestamp': datetime.now().isoformat(),
                        'response_type': 'rag',
                        'context_used': len(context_chunks)
                    }
                else:
                    # Stream chunk
                    full_response += chunk
                    yield {
                        'type': 'chunk',
                        'content': chunk,
                        'session_id': session_id,
                        'timestamp': datetime.now().isoformat()
                    }
            
            # Add assistant message to session
            self.chat_sessions[session_id]['messages'].append({
                'role': 'assistant',
                'content': full_response,
                'timestamp': datetime.now().isoformat(),
                'response_type': 'rag',
                'sources': sources
            })
            
            logger.info(f"Generated streaming RAG response using {len(context_chunks)} context chunks")
            
        except Exception as e:
            logger.error(f"Error generating streaming RAG response: {str(e)}")
            import traceback
            traceback.print_exc()
            yield {
                'type': 'error',
                'content': f"I encountered an error while processing your request: {str(e)}",
                'session_id': session_id,
                'timestamp': datetime.now().isoformat()
            }

    def clear_document_cache(self):
        """Clear document cache to force refresh of document state."""
        self._document_cache_timestamp = None
        logger.info("Document cache cleared")
    
    def _validate_document_availability(self) -> bool:
        """Validate if documents are actually available in the database."""
        try:
            doc_count = chroma_manager.get_document_count()
            return doc_count > 0
        except Exception as e:
            logger.error(f"Error validating document availability: {str(e)}")
            return False

# Global chat service instance
chat_service = ChatService()
