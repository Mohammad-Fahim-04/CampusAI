"""PDF-backed retrievers. Built lazily so the app starts even when PDFs are missing."""
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

PDF_FILES = {
    "academic": "academics_handbook.pdf",
    "fee": "fee_structure.pdf",
}

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

_embeddings = None
_retrievers = {}


class PDFMissingError(Exception):
    """Raised when a required PDF is not in ai-service/data/."""


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        from langchain_huggingface import HuggingFaceEmbeddings

        _embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return _embeddings


def _build_retriever(pdf_path: Path):
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_community.vectorstores import FAISS
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    try:
        pages = PyPDFLoader(str(pdf_path)).load()
    except Exception as exc:
        raise PDFMissingError(
            f"{pdf_path.name} could not be read. Check that it is a valid, readable PDF."
        ) from exc
    splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=120)
    chunks = splitter.split_documents(pages)
    if not chunks:
        raise PDFMissingError(f"{pdf_path.name} contains no readable text.")
    store = FAISS.from_documents(chunks, _get_embeddings())
    return store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 5, "fetch_k": 15, "lambda_mult": 0.5},
    )


def get_retriever(kind: str):
    """Return the retriever for 'academic' or 'fee'. Raises PDFMissingError if the PDF is absent."""
    if kind in _retrievers:
        return _retrievers[kind]
    pdf_path = DATA_DIR / PDF_FILES[kind]
    if not pdf_path.is_file():
        raise PDFMissingError(
            f"{PDF_FILES[kind]} was not found. Add it to ai-service/data/ and restart the backend."
        )
    retriever = _build_retriever(pdf_path)
    _retrievers[kind] = retriever
    return retriever


def get_academic_retriever():
    return get_retriever("academic")


def get_fee_retriever():
    return get_retriever("fee")
