from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma


def ingest_pdf_to_chroma(pdf_path: str, persist_dir: str, collection_name: str) -> None:
    try:
        # 1) Load PDF pages as Documents
        loader = PyPDFLoader(pdf_path, mode="page")
        documents = loader.load()

        if not documents:
            raise ValueError("No text extracted from the PDF. It might be a scanned/image-only PDF.")

        # 2) Split into chunks for better retrieval
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = splitter.split_documents(documents)

        if not chunks:
            raise ValueError("PDF loaded but produced no chunks after splitting.")

        # 3) Local embeddings (FREE) — no OpenAI
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        # 4) Store in Chroma
        vectordb = Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            persist_directory=persist_dir
        )

        vectordb.add_documents(chunks)


    except Exception as e:
        print("INGEST_PDF_TO_CHROMA ERROR:", repr(e))
        raise
