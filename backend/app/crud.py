from sqlalchemy.orm import Session
from . import models, schemas
from typing import List

def get_projects(db: Session) -> List[models.Project]:
    return db.query(models.Project).all()

def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(name=project.name, description=project.description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = get_project(db, project_id)
    if db_project:
        db.delete(db_project)
        db.commit()
    return db_project

# Document CRUD

def get_documents(db: Session, project_id: int):
    return db.query(models.Document).filter(models.Document.project_id == project_id).all()

def create_document(db: Session, document: schemas.DocumentCreate):
    db_document = models.Document(**document.dict())
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def get_document(db: Session, document_id: int):
    return db.query(models.Document).filter(models.Document.id == document_id).first()

def delete_document(db: Session, document_id: int):
    db_document = get_document(db, document_id)
    if db_document:
        db.delete(db_document)
        db.commit()
    return db_document

# ChatSession CRUD

def create_session(db: Session, project_id: int):
    session = models.ChatSession(project_id=project_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def get_sessions(db: Session, project_id: int):
    return db.query(models.ChatSession).filter(models.ChatSession.project_id == project_id).all()

# Message CRUD

def create_message(db: Session, session_id: int, sender: str, text: str, embedding_ref: str = None, language: str = 'en', image_url: str = None, ocr_text: str = None):
    message = models.Message(
        session_id=session_id,
        sender=sender,
        text=text,
        embedding_ref=embedding_ref,
        language=language,
        image_url=image_url,
        ocr_text=ocr_text
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

def get_messages(db: Session, session_id: int):
    return db.query(models.Message).filter(models.Message.session_id == session_id).all()

def create_chat_session(db: Session, project_id: int, history=None, language='en'):
    session = models.ChatSession(project_id=project_id, history=history or [], language=language)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def get_chat_session(db: Session, session_id: int):
    return db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()

def update_chat_session_history(db: Session, session_id: int, history, language=None):
    session = get_chat_session(db, session_id)
    if session:
        session.history = history
        if language:
            session.language = language
        db.commit()
    return session

def create_user_preference(db: Session, language="en", preferred_prompt_template=None, voice_enabled="false"):
    pref = models.UserPreference(language=language, preferred_prompt_template=preferred_prompt_template, voice_enabled=voice_enabled)
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref

def get_user_preference(db: Session, pref_id: int):
    return db.query(models.UserPreference).filter(models.UserPreference.id == pref_id).first()

def update_user_preference(db: Session, pref_id: int, **kwargs):
    pref = get_user_preference(db, pref_id)
    if pref:
        for k, v in kwargs.items():
            setattr(pref, k, v)
        db.commit()
    return pref 