from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/autorag"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Google Cloud Storage
    GCS_BUCKET: str = "autorag-bucket"
    GOOGLE_APPLICATION_CREDENTIALS: str = "D:\\Autorag\\backend\\app\\ragauto-app.json"
    
    # Pinecone
    PINECONE_API_KEY: str = ""
    PINECONE_ENV: str = "us-east-1"
    PINECONE_INDEX: str = "autorag-index"
    
    # Groq API
    GROQ_API_KEY: str = ""
    GROQ_LLAMA_API_KEY: str = ""
    
    # Google Drive Picker
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_API_KEY: str = ""
    
    # Deepgram API
    DEEPGRAM_API_KEY: str = ""
    
    # ElevenLabs API
    ELEVENLABS_API_KEY: str = ""
    
    # Legacy/Alternative fields (keeping for compatibility)
    QDRANT_URL: str = ""
    # Jina AI API
    JINA_API_KEY: str = ""
    groq_api_key: str | None = None

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings() 