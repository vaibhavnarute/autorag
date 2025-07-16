from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    documents = relationship("Document", back_populates="project")
    sessions = relationship("ChatSession", back_populates="project")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    filename = Column(String, nullable=False)
    filetype = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="processing")
    project = relationship("Project", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document")

class Chunk(Base):
    __tablename__ = "chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    text = Column(Text, nullable=False)
    chunk_metadata = Column(JSON, nullable=True)
    vector_id = Column(String, nullable=True)
    document = relationship("Document", back_populates="chunks")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    history = Column(JSON, default=list)  # Store chat history as a list of messages
    language = Column(String, default="en")
    project = relationship("Project", back_populates="sessions")
    messages = relationship("Message", back_populates="session")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    sender = Column(String, nullable=False)  # 'user' or 'ai'
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    embedding_ref = Column(String, nullable=True)
    language = Column(String, default="en")
    image_url = Column(String, nullable=True)
    ocr_text = Column(Text, nullable=True)
    session = relationship("ChatSession", back_populates="messages")

class UserPreference(Base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True, index=True)
    # Add user_id if/when auth is implemented
    language = Column(String, default="en")
    preferred_prompt_template = Column(Text, nullable=True)
    voice_enabled = Column(String, default="false")
    # Add more preferences as needed 