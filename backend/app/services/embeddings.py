
import requests
from pinecone import Pinecone
from ..config import settings

JINA_API_KEY = settings.JINA_API_KEY
JINA_EMBEDDING_URL = "https://api.jina.ai/v1/embeddings"


def embed_texts(texts):
    """
    Generate embeddings using Jina AI's jina-embeddings-v2-base-en model.
    """
    if isinstance(texts, str):
        texts = [texts]
    print("JINA_API_KEY used:", repr(JINA_API_KEY))
    headers = {
        "Authorization": f"Bearer {JINA_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "input": texts,
        "model": "jina-embeddings-v2-base-en"
    }
    response = requests.post(JINA_EMBEDDING_URL, headers=headers, json=data)
    response.raise_for_status()
    result = response.json()
    embeddings = [item["embedding"] for item in result["data"]]
    return embeddings

# Pinecone upsert remains unchanged

pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX)

def upsert_to_pinecone(ids, embeddings, metadatas):
    vectors = [
        {"id": str(id_), "values": emb, "metadata": meta}
        for id_, emb, meta in zip(ids, embeddings, metadatas)
    ]
    index.upsert(vectors=vectors) 