import os
from . import embeddings
import pinecone
import requests
from typing import List, Dict, Any, Generator
from ..config import settings
from groq import Groq

groq_api_key = settings.GROQ_API_KEY
client = Groq()

GROQ_API_KEY = settings.GROQ_API_KEY
GROQ_LLAMA_API_KEY = settings.GROQ_LLAMA_API_KEY
GROQ_LLM_URL = 'https://api.groq.com/openai/v1/chat/completions'  # Example endpoint
LLM_MODEL = 'qwen/qwen3-32b'

index = embeddings.index

DEFAULT_PROMPT_TEMPLATE = (
    "You are an expert assistant. Use the provided document chunks and chat history to answer the user's question. "
    "Cite sources using [chunk_index] where relevant.\n\n"
    "Context:\n{context}\n\n"
    "Chat History:\n{history}\n\n"
    "Question: {question}\n\nAnswer:"
)

# --- Chat History Management ---
def build_history(messages: List[Dict[str, Any]], max_turns: int = 50) -> str:
    # messages: [{"role": "user"|"ai", "content": ...}]
    history = []
    for msg in messages[-max_turns:]:
        prefix = "User:" if msg['role'] == 'user' else "AI:"
        history.append(f"{prefix} {msg['content']}")
    return "\n".join(history)

# --- Retrieval ---
def retrieve_relevant_chunks(query, project_id, top_k=5):
    query_emb = embeddings.embed_texts([query])[0]
    results = index.query(vector=query_emb, top_k=top_k, include_metadata=True, filter={"project_id": project_id})
    chunks = []
    for match in results['matches']:
        chunks.append({
            'text': match['metadata'].get('text', ''),
            'chunk_index': match['metadata'].get('chunk_index', -1),
            'document_id': match['metadata'].get('document_id'),
            'score': match['score'],
        })
    return chunks

# --- Prompt Assembly ---
def assemble_prompt(chunks, question, history, prompt_template=DEFAULT_PROMPT_TEMPLATE, language=None):
    context = "\n\n".join(f"[Chunk {c['chunk_index']}] {c['text']}" for c in chunks)
    history_str = build_history(history)
    lang_instruction = f"Please answer in {language}.\n" if language else ""
    return lang_instruction + prompt_template.format(context=context, question=question, history=history_str)

# --- LLM Call ---
def call_llm(prompt, model="qwen/qwen3-32b"):
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "user", "content": prompt}
        ],
        model=model,
        stream=False,
    )
    return chat_completion.choices[0].message.content

# --- Follow-up Suggestions ---
def suggest_followups(answer: str, question: str, language='en', model=None) -> List[str]:
    # Use LLM to generate follow-up questions
    prompt = (
        f"Given the answer to the user's question, suggest 3 relevant follow-up questions.\n"
        f"Question: {question}\nAnswer: {answer}\nSuggestions:"
    )
    model = model or LLM_MODEL
    if model.startswith('llama'):
        api_key = GROQ_LLAMA_API_KEY
    elif model.startswith('qwen'):
        api_key = GROQ_API_KEY
    else:
        api_key = GROQ_LLAMA_API_KEY
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }
    data = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.5,
        'max_tokens': 128,
    }
    response = requests.post(GROQ_LLM_URL, headers=headers, json=data)
    response.raise_for_status()
    result = response.json()
    suggestions = result['choices'][0]['message']['content'].split('\n')
    return [s.strip('- ').strip() for s in suggestions if s.strip()]

# --- Main RAG Chat ---
def rag_chat(
    project_id,
    question,
    prompt_template=DEFAULT_PROMPT_TEMPLATE,
    language='en',
    top_k=5,
    history: List[Dict[str, Any]] = None,
    stream: bool = False,
    model: str = None
):
    history = history or []
    chunks = retrieve_relevant_chunks(question, project_id, top_k=top_k)
    prompt = assemble_prompt(chunks, question, history, prompt_template, language)
    # Always use Qwen model
    answer = call_llm(prompt, model="qwen/qwen3-32b")
    raw_model_response = None  # or set to something meaningful if needed
    sources = [c['chunk_index'] for c in chunks]
    followups = suggest_followups(answer, question, language, model="qwen/qwen3-32b")
    return {
        'answer': answer,
        'sources': sources,
        'raw_model_response': raw_model_response,
        'prompt': prompt,
        'chunks': chunks,
        'followups': followups,
        'history': history[-50:],
    } 