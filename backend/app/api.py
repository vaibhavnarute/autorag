"""
Frontend Integration Instructions:
- To start a chat session: POST /api/sessions { project_id }
- To send a chat message: POST /api/chat { project_id, question, history, ... }
- To get chat session history: GET /api/sessions/{session_id}
- To update chat session history: PATCH /api/sessions/{session_id} { history }
- To get/set user preferences: GET/PATCH /api/preferences/{pref_id}
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Body, Request
from sqlalchemy.orm import Session
from typing import List
from . import crud, schemas, models, deps
import uuid
import os
from .config import settings
from .tasks import ingest_document
import pdfplumber
import docx
import csv
from .services import rag
from .services import ingestion
import requests
from fastapi.responses import FileResponse, JSONResponse

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

from .config import settings

DEEPGRAM_API_KEY = settings.DEEPGRAM_API_KEY
ELEVENLABS_API_KEY = settings.ELEVENLABS_API_KEY

def save_upload_file(upload_file: UploadFile, destination: str):
    with open(destination, "wb") as buffer:
        buffer.write(upload_file.file.read())

def extract_text_from_pdf(file_path):
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        text = ""
    return text

def extract_text_from_docx(file_path):
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        text = ""
    return text

def extract_text_from_csv(file_path):
    text = ""
    try:
        with open(file_path, newline='', encoding='utf-8', errors='ignore') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                text += ', '.join(row) + "\n"
    except Exception as e:
        text = ""
    return text

router = APIRouter()

# Project Endpoints
@router.get("/projects", response_model=List[schemas.Project])
def list_projects(db: Session = Depends(deps.get_db)):
    return crud.get_projects(db)

@router.post("/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(deps.get_db)):
    return crud.create_project(db, project)

@router.get("/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(deps.get_db)):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(deps.get_db)):
    project = crud.delete_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}

# Document Endpoints
@router.get("/projects/{project_id}/documents", response_model=List[schemas.Document])
def list_documents(project_id: int, db: Session = Depends(deps.get_db)):
    return crud.get_documents(db, project_id)

@router.post("/documents", response_model=schemas.Document)
def create_document(document: schemas.DocumentCreate, db: Session = Depends(deps.get_db)):
    return crud.create_document(db, document)

@router.get("/documents/{document_id}", response_model=schemas.Document)
def get_document(document_id: int, db: Session = Depends(deps.get_db)):
    doc = crud.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(deps.get_db)):
    doc = crud.delete_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"ok": True}

# Document Upload Endpoint
@router.post("/documents/upload", response_model=schemas.Document)
def upload_document(
    project_id: int = Form(...),
    file: UploadFile = File(None),
    url: str = Form(None),
    db: Session = Depends(deps.get_db),
    background_tasks: BackgroundTasks = None
):
    try:
        if file:
            filename = f"{uuid.uuid4()}_{file.filename}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            save_upload_file(file, file_path)
            filetype = file.content_type or 'application/octet-stream'
            # Expand file type handling
            if filetype == 'application/pdf' or filename.lower().endswith('.pdf'):
                text = extract_text_from_pdf(file_path)
            elif filetype in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'] or filename.lower().endswith('.docx'):
                text = extract_text_from_docx(file_path)
            elif filetype == 'text/csv' or filename.lower().endswith('.csv'):
                text = extract_text_from_csv(file_path)
            elif filetype == 'text/plain' or filename.lower().endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
            else:
                text = None  # Let background task handle images/other types
            doc = schemas.DocumentCreate(
                project_id=project_id,
                filename=filename,
                filetype=filetype
            )
            db_doc = crud.create_document(db, doc)
            # Trigger background ingestion task
            ingest_document.delay(db_doc.id)
            return db_doc
        elif url:
            doc = schemas.DocumentCreate(
                project_id=project_id,
                filename=url,
                filetype='url'
            )
            db_doc = crud.create_document(db, doc)
            ingest_document.delay(db_doc.id)
            return db_doc
        else:
            raise HTTPException(status_code=400, detail="No file or URL provided.")
    except Exception as e:
        # Error handling: update document status if created
        if 'db_doc' in locals():
            db_doc.status = 'error'
            db.commit()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Ingestion Status Endpoint
@router.get("/ingestion/{document_id}/status")
def ingestion_status(document_id: int, db: Session = Depends(deps.get_db)):
    doc = crud.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # For now, just return the document status field
    return {"status": doc.status}

# Chat Session Endpoints
@router.post("/sessions", response_model=schemas.ChatSession)
def create_chat_session(project_id: int = Form(...), language: str = Form('en'), db: Session = Depends(deps.get_db)):
    session = crud.create_chat_session(db, project_id, language=language)
    return session

@router.get("/sessions/{session_id}", response_model=schemas.ChatSession)
def get_chat_session(session_id: int, db: Session = Depends(deps.get_db)):
    return crud.get_chat_session(db, session_id)

@router.patch("/sessions/{session_id}", response_model=schemas.ChatSession)
def update_chat_session(session_id: int, history: list = Body(...), language: str = Body(None), db: Session = Depends(deps.get_db)):
    return crud.update_chat_session_history(db, session_id, history, language)

@router.get("/preferences/{pref_id}", response_model=schemas.UserPreference)
def get_user_preference(pref_id: int, db: Session = Depends(deps.get_db)):
    return crud.get_user_preference(db, pref_id)

@router.patch("/preferences/{pref_id}", response_model=schemas.UserPreference)
def update_user_preference(pref_id: int, language: str = Body(None), preferred_prompt_template: str = Body(None), voice_enabled: str = Body(None), db: Session = Depends(deps.get_db)):
    kwargs = {k: v for k, v in {"language": language, "preferred_prompt_template": preferred_prompt_template, "voice_enabled": voice_enabled}.items() if v is not None}
    return crud.update_user_preference(db, pref_id, **kwargs)

# Message Endpoints
@router.post("/messages", response_model=schemas.Message)
def create_message(session_id: int = Form(...), sender: str = Form(...), text: str = Form(...), embedding_ref: str = Form(None), language: str = Form('en'), db: Session = Depends(deps.get_db)):
    return crud.create_message(db, session_id, sender, text, embedding_ref, language)

@router.get("/sessions/{session_id}/messages", response_model=List[schemas.Message])
def list_messages(session_id: int, db: Session = Depends(deps.get_db)):
    return crud.get_messages(db, session_id)

@router.patch("/documents/{document_id}/status")
def update_document_status(document_id: int, status: str = Body(...), db: Session = Depends(deps.get_db)):
    ingestion.update_document_status(document_id, status)
    return {"ok": True, "status": status}

@router.post("/chat")
def chat_endpoint(request: Request, body: dict = None):
    try:
        data = body or (request.json() if hasattr(request, 'json') else {})
        project_id = data.get('project_id')
        question = data.get('question')
        prompt_template = data.get('prompt_template', rag.DEFAULT_PROMPT_TEMPLATE)
        language = data.get('language', 'en')
        history = data.get('history', [])
        stream = data.get('stream', False)
        if not project_id or not question:
            raise HTTPException(status_code=400, detail="project_id and question are required")
        if stream:
            return rag.rag_chat(project_id, question, prompt_template, language, history=history, stream=True)
        result = rag.rag_chat(project_id, question, prompt_template, language, history=history)
        return result
    except Exception as e:
        import traceback
        print(traceback.format_exc())  # This will print the real error to your terminal
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- ElevenLabs TTS Endpoint ---
@router.post("/tts")
def tts_endpoint(text: str = Body(...), voice_id: str = Body('EXAVITQu4vr4xnSDxMaL'), language: str = Body('en')):
    """
    Convert text to speech using ElevenLabs API. Returns a URL to the generated audio file.
    voice_id: You can use a default or let the frontend specify.
    """
    output_path = f"static/tts/{voice_id}_{abs(hash(text))}.mp3"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    response = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        },
        json={
            "text": text,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
        }
    )
    if response.status_code != 200:
        return JSONResponse(status_code=500, content={"error": response.text})
    with open(output_path, "wb") as f:
        f.write(response.content)
    return {"audio_url": f"/{output_path}"}

# --- Deepgram STT Endpoint ---
@router.post("/stt")
def stt_endpoint(audio_url: str = Body(...)):
    """
    Transcribe audio using Deepgram API. Accepts a public audio URL and returns the transcription.
    """
    response = requests.post(
        "https://api.deepgram.com/v1/listen",
        headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"},
        json={"url": audio_url}
    )
    if response.status_code != 200:
        return JSONResponse(status_code=500, content={"error": response.text})
    result = response.json()
    transcript = result.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript", "")
    return {"text": transcript}

@router.post("/chat/image")
def chat_image_endpoint(
    project_id: int = Form(...),
    image: UploadFile = File(...),
    history: list = Form(None),
    prompt_template: str = Form(None),
    language: str = Form('en'),
    session_id: int = Form(None),
    db: Session = Depends(deps.get_db)
):
    import uuid, os, shutil
    filename = f"chat_{uuid.uuid4()}_{image.filename}"
    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    temp_path = os.path.join(upload_dir, filename)
    with open(temp_path, "wb") as buffer:
        buffer.write(image.file.read())
    # Optionally, save a static copy for preview
    static_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'chat_images')
    os.makedirs(static_dir, exist_ok=True)
    static_path = os.path.join(static_dir, filename)
    shutil.copy(temp_path, static_path)
    image_url = f"/static/chat_images/{filename}"
    # Run OCR/vision model
    ocr_text = ingestion.extract_text_from_image(temp_path)
    # Use OCR text as the chat query
    from .services import rag
    result = rag.rag_chat(
        project_id=project_id,
        question=ocr_text,
        prompt_template=prompt_template or rag.DEFAULT_PROMPT_TEMPLATE,
        language=language,
        history=history or []
    )
    result['ocr_text'] = ocr_text
    result['image_url'] = image_url
    # Store messages if session_id is provided
    if session_id:
        from . import crud
        crud.create_message(db, session_id, 'user', '[Image uploaded]', language=language, image_url=image_url)
        crud.create_message(db, session_id, 'ai', result['answer'], language=language, ocr_text=ocr_text)
    # Optionally, delete temp file
    try:
        os.remove(temp_path)
    except Exception:
        pass
    return result 

from fastapi import APIRouter, Body, HTTPException
import requests
import os

@router.post("/documents/upload/cloud")
def upload_cloud_file(
    project_id: int = Body(...),
    provider: str = Body(...),  # 'google'
    file_id: str = Body(...),
    oauth_token: str = Body(...),
    file_name: str = Body(...)
):
    if provider != 'google':
        raise HTTPException(status_code=400, detail="Only Google Drive supported for now")
    # Download file from Google Drive
    headers = {'Authorization': f'Bearer {oauth_token}'}
    download_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
    response = requests.get(download_url, headers=headers, stream=True)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch file from Google Drive")
    # Save file to uploads directory
    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file_name)
    with open(file_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    # Now process as a normal upload (call your ingestion pipeline, etc.)
    # ... (rest of your upload logic)
    return {"status": "uploaded", "file_name": file_name} 