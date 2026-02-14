import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from rag.ingest import ingest_pdf_to_chroma
from rag.chain import build_heading_chain

load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
print("OLLAMA MODEL:", OLLAMA_MODEL)

BASE_DIR = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "uploads")
CHROMA_DIR = os.path.join(BASE_DIR, "data", "chroma")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYLLABI = {}  # syllabus_id -> collection_name


class UploadResponse(BaseModel):
    syllabus_id: str


class ChatRequest(BaseModel):
    syllabus_id: str
    heading: str
    minutes: int = 60


class ChatResponse(BaseModel):
    answer: str


@app.get("/health")
def health():
    return {"ok": True, "syllabi_loaded": len(SYLLABI), "ollama_model": OLLAMA_MODEL}


@app.post("/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF syllabus.")

    syllabus_id = str(uuid.uuid4())
    pdf_path = os.path.join(UPLOAD_DIR, f"{syllabus_id}.pdf")

    content = await file.read()
    with open(pdf_path, "wb") as f:
        f.write(content)

    collection_name = f"syllabus_{syllabus_id}"

    try:
        ingest_pdf_to_chroma(pdf_path, CHROMA_DIR, collection_name)
    except Exception as e:
        print("INGEST ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

    SYLLABI[syllabus_id] = collection_name
    return UploadResponse(syllabus_id=syllabus_id)


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    collection_name = SYLLABI.get(req.syllabus_id)
    if not collection_name:
        raise HTTPException(status_code=404, detail="Unknown syllabus_id. Upload first.")

    chain = build_heading_chain(CHROMA_DIR, collection_name, OLLAMA_MODEL)

    try:
        answer = chain.invoke({"heading": req.heading, "minutes": req.minutes})
    except Exception as e:
        print("CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

    return ChatResponse(answer=answer)
@app.get("/")
def root():
    return {"message": "Backend is running. Go to /docs"}
@app.get("/favicon.ico")
def favicon():
    return {}
