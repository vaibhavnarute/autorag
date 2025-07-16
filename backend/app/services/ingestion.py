import os
from ..config import settings
from ..database import SessionLocal
from .. import crud
from google.cloud import storage
from google.cloud import vision

# Set Google Cloud credentials
if settings.GOOGLE_APPLICATION_CREDENTIALS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.GOOGLE_APPLICATION_CREDENTIALS
import cv2
import spacy
import pdfplumber
import docx
import csv
import requests
from bs4 import BeautifulSoup

def upload_to_gcs(local_path, bucket_name, dest_blob_name):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(dest_blob_name)
    blob.upload_from_filename(local_path)
    return f'gs://{bucket_name}/{dest_blob_name}'

def update_document_status(document_id, status):
    db = SessionLocal()
    doc = crud.get_document(db, document_id)
    if doc:
        doc.status = status
        db.commit()
    db.close()

def extract_text_from_pdf(file_path):
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception:
        text = ""
    return text

def extract_text_from_docx(file_path):
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception:
        text = ""
    return text

def extract_text_from_csv(file_path):
    text = ""
    try:
        with open(file_path, newline='', encoding='utf-8', errors='ignore') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                text += ', '.join(row) + "\n"
    except Exception:
        text = ""
    return text

def extract_text_from_image(file_path):
    # Preprocess image with OpenCV
    image = cv2.imread(file_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 128, 255, cv2.THRESH_BINARY_INV)
    cv2.imwrite(file_path, thresh)
    # OCR with Google Vision
    client = vision.ImageAnnotatorClient()
    with open(file_path, "rb") as image_file:
        content = image_file.read()
    image_vision = vision.Image(content=content)
    response = client.text_detection(image=image_vision)
    texts = response.text_annotations
    if texts:
        return texts[0].description
    return ""

def extract_text_from_url(url):
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, 'html.parser')
    return soup.get_text()

def process_text_with_spacy(text):
    nlp = spacy.load('en_core_web_sm')
    doc_spacy = nlp(text)
    entities = [(ent.text, ent.label_) for ent in doc_spacy.ents]
    return entities 