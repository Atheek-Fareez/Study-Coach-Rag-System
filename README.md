
# 📚 RAG Student App — Syllabus Study Assistant (LangChain + Chroma + Ollama + React)

A full-stack RAG (Retrieval-Augmented Generation) application where students can upload a syllabus PDF and ask questions by specific heading/topic.  
The system retrieves the most relevant parts of the syllabus and generates a structured study response (core concepts, best order, study plan, key terms).

✨ Key Features

 ✅ Backend (FastAPI + LangChain)
- 📤 Upload syllabus PDF via API (`/upload`)
- 🧠 Ingest & chunk PDF content (text extraction + splitting)
- 🔎 Vector search retrieval using ChromaDB
- 🧩 Local embeddings using SentenceTransformers (HuggingFace)
- 🤖 Local LLM answering using Ollama (no OpenAI cost)
- 🧾 Returns structured answers:
  1) Core concepts  
  2) Best study order  
  3) Study plan for given minutes  
  4) Key terms / subtopics  
  5) References (if available)

 ✅ Frontend (React)
- 📄 Upload PDF from UI
- 🆔 Shows returned `syllabus_id`
- ✍️ Input heading/topic + minutes
- 💬 Displays AI-generated answer
- ❌ Shows clear error messages (upload/chat failures)


 🧰 Tech Stack

Backend
- Python 3.11
- FastAPI (REST API)
- Uvicorn (ASGI server)
- LangChain
- ChromaDB (vector database)
- SentenceTransformers for embeddings
- Ollama for local LLM inference
- PyPDF for PDF text extraction
- python-dotenv for environment variables

Frontend
- React (Vite)
- Axios (API calls)
- CSS (simple UI styling)

