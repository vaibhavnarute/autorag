from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    filename: str
    filetype: str

class DocumentCreate(DocumentBase):
    project_id: int

class Document(DocumentBase):
    id: int
    project_id: int
    created_at: datetime
    status: str
    class Config:
        from_attributes = True

class ChunkBase(BaseModel):
    text: str
    chunk_metadata: Optional[Any] = None
    vector_id: Optional[str] = None

class Chunk(ChunkBase):
    id: int
    document_id: int
    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    project_id: int

class ChatSession(ChatSessionBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    sender: str
    text: str
    embedding_ref: Optional[str] = None
    language: Optional[str] = 'en'
    image_url: Optional[str] = None
    ocr_text: Optional[str] = None

class Message(MessageBase):
    id: int
    session_id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class UserPreferenceBase(BaseModel):
    language: Optional[str] = 'en'
    preferred_prompt_template: Optional[str] = None
    voice_enabled: Optional[bool] = False

class UserPreferenceCreate(UserPreferenceBase):
    pass

class UserPreference(UserPreferenceBase):
    id: int
    class Config:
        from_attributes = True 