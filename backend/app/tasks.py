import os
from celery import Celery
from .config import settings
from .database import SessionLocal
from . import crud, models
from .services import ingestion
import uuid

celery_app = Celery(
    'autorag',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Placeholder for GCS integration
from google.cloud import storage

def upload_to_gcs(local_path, bucket_name, dest_blob_name):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(dest_blob_name)
    blob.upload_from_filename(local_path)
    return f'gs://{bucket_name}/{dest_blob_name}'

# Placeholder for OpenCV, Google Vision, spaCy imports
import cv2
import spacy
from google.cloud import vision
from .services import embeddings

def chunk_text(text, chunk_size=500):
    # Simple chunking by words
    words = text.split()
    chunks = [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]
    return chunks

@celery_app.task
def ingest_document(document_id: int):
    db = SessionLocal()
    doc = crud.get_document(db, document_id)
    if not doc:
        db.close()
        return
    try:
        ingestion.update_document_status(document_id, 'processing')
        file_path = os.path.join(os.path.dirname(__file__), '..', 'uploads', doc.filename)
        text = ""
        if doc.filetype.startswith('image/'):
            text = ingestion.extract_text_from_image(file_path)
        elif doc.filetype == 'url':
            text = ingestion.extract_text_from_url(doc.filename)
        elif doc.filetype == 'application/pdf' or doc.filename.lower().endswith('.pdf'):
            text = ingestion.extract_text_from_pdf(file_path)
        elif doc.filetype in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'] or doc.filename.lower().endswith('.docx'):
            text = ingestion.extract_text_from_docx(file_path)
        elif doc.filetype == 'text/csv' or doc.filename.lower().endswith('.csv'):
            text = ingestion.extract_text_from_csv(file_path)
        elif doc.filetype == 'text/plain' or doc.filename.lower().endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        else:
            text = ""
        entities = ingestion.process_text_with_spacy(text) if text else []
        from .config import settings
        # Upload file to GCS
        gcs_url = ingestion.upload_to_gcs(file_path, settings.GCS_BUCKET, doc.filename)
        # Chunk text and generate embeddings
        if text:
            chunks = chunk_text(text)
            embeddings_arr = embeddings.embed_texts(chunks)
            ids = [str(uuid.uuid4()) for _ in chunks]
            metadatas = [{"document_id": doc.id, "chunk_index": i} for i in range(len(chunks))]
            embeddings.upsert_to_pinecone(ids, embeddings_arr, metadatas)
            # Store chunks in DB
            for i, (chunk, vector_id) in enumerate(zip(chunks, ids)):
                db_chunk = models.Chunk(document_id=doc.id, text=chunk, chunk_metadata={"chunk_index": i}, vector_id=vector_id)
                db.add(db_chunk)
            db.commit()
        # Update document status and metadata
        db_doc = crud.get_document(db, document_id)
        db_doc.status = 'ready'
        db.commit()
        db.close()
        return {'text': text, 'entities': entities, 'gcs_url': gcs_url}
    except Exception as e:
        ingestion.update_document_status(document_id, 'error')
        db.close()
        return {'error': str(e)} 