# 🚧 Auto RAG Wizard Chat

> **Note:**  
> This project is **under active development**. Features, APIs, and UI are subject to change.  
> Contributions and feedback are welcome!

---

## 🌟 What is Auto RAG Wizard Chat?

**Auto RAG Wizard Chat** is a modern, modular platform for building Retrieval-Augmented Generation (RAG) chatbots and assistants. It combines a beautiful chat UI with a powerful backend for document ingestion, embedding, retrieval, and LLM-powered responses.

---

## 🧭 Project Flow

1. **User Uploads Data:**  
   Users upload documents (PDFs, text, etc.) via the chat interface or file upload.

2. **Document Ingestion:**  
   The backend splits documents into chunks and prepares them for embedding.

3. **Embedding Generation:**  
   Each chunk is converted into a vector embedding using state-of-the-art models.

4. **Vector Storage:**  
   Embeddings are stored in a vector database for efficient similarity search.

5. **Chat & Retrieval:**  
   When a user asks a question, the system retrieves the most relevant document chunks using vector similarity.

6. **LLM Augmentation:**  
   The retrieved context is sent to a Large Language Model (LLM) to generate a grounded, context-aware response.

7. **Response Display:**  
   The answer, along with source references, is displayed in the chat UI.

---

## ✨ Features

- Modern, responsive chat UI with file upload and language selection
- Backend API for document ingestion, embedding, and retrieval
- Support for multiple embedding and LLM providers
- Extensible architecture for custom workflows
- Role-based access and user preferences (planned)
- Open source and easy to deploy

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, shadcn-ui, Tailwind CSS
- **Backend:** FastAPI, Python, SQLAlchemy, Alembic
- **Vector DB:** Pluggable (e.g., FAISS, Pinecone, Chroma, etc.)
- **LLM Providers:** OpenAI, HuggingFace, or custom

---

## 🚀 Getting Started

### Prerequisites

- Node.js & npm (for frontend)
- Python 3.8+ (for backend)
- [Optional] Docker

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 🗺️ Roadmap

- [x] Core chat and RAG pipeline
- [ ] User authentication and project management
- [ ] Advanced analytics and feedback loop
- [ ] Multi-modal support (images, audio, etc.)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Please open an issue or submit a pull request.

---

## 📄 License

This project is [MIT Licensed](LICENSE).

---

## 📢 Acknowledgements

- [Vite](https://vitejs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenAI](https://openai.com/)
- [HuggingFace](https://huggingface.co/)

---

## 🌐 Links

- [Project Repository](https://github.com/vaibhavnarute/auto-rag-wizard-chat)
- [Project Info](https://lovable.dev/projects/1df91b05-c452-4cd8-8ebb-4edc3c5468e3)

--- 
