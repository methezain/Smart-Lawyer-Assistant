from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API Configuration
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_api_url: str = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1")
    api_host: str = os.getenv("API_HOST", "localhost")
    api_port: int = int(os.getenv("API_PORT", "8014"))
    
    # LLM Configuration
    use_groq: bool = os.getenv("USE_GROQ", "true").lower() == "true"
    groq_model: str = os.getenv("GROQ_MODEL", "llama3-70b-8192")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers")
    
    # ChromaDB Configuration
    chroma_db_path: str = os.getenv("CHROMA_DB_PATH", "./chroma_db")
    chroma_collection_name: str = os.getenv("CHROMA_COLLECTION_NAME", "law_documents")
    
    # File Upload Configuration
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", "104857600").split('#')[0].strip())
    allowed_extensions: List[str] = os.getenv("ALLOWED_EXTENSIONS", "pdf,txt,docx").split(",")
    upload_directory: str = os.getenv("UPLOAD_DIRECTORY", "./uploads")
    
    # Text Processing Configuration
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1000"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    max_chunks_per_document: int = int(os.getenv("MAX_CHUNKS_PER_DOCUMENT", "100"))
    
    # Logging Configuration
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # CORS Configuration
    cors_origins: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
    
    def get_cors_origins(self):
        """Get CORS origins, handling the wildcard case."""
        if self.cors_origins == ["*"]:
            return ["*"]
        return self.cors_origins

# Global settings instance
settings = Settings()

# Ensure directories exist
os.makedirs(settings.upload_directory, exist_ok=True)
os.makedirs(settings.chroma_db_path, exist_ok=True)
