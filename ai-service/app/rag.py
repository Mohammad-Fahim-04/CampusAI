"""PDF-backed retrievers. Built lazily so the app starts even when PDFs are missing."""
import logging
from time import perf_counter
from pathlib import Path

logger = logging.getLogger(__name__)

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
        started = perf_counter()
        logger.info("[CHAT] embedding model initialization started")
        from langchain_huggingface import HuggingFaceEmbeddings

        _embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        logger.info(
            "[CHAT] embedding model initialized in %.2fs",
            perf_counter() - started,
        )
    return _embeddings


def _build_retriever(pdf_path: Path):
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_community.vectorstores import FAISS
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    pdf_started = perf_counter()
    logger.info("[CHAT] PDF loading started (%s)", pdf_path.name)
    try:
        pages = PyPDFLoader(str(pdf_path)).load()
    except Exception as exc:
        logger.exception("[CHAT] PDF loading failed (%s)", pdf_path.name)
        raise PDFMissingError(
            f"{pdf_path.name} could not be read. Check that it is a valid, readable PDF."
        ) from exc
    logger.info(
        "[CHAT] PDF loaded in %.2fs (%s, pages=%d)",
        perf_counter() - pdf_started,
        pdf_path.name,
        len(pages),
    )
    split_started = perf_counter()
    splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=120)
    chunks = splitter.split_documents(pages)
    logger.info("[CHAT] document splitting completed in %.2fs (chunks=%d)", perf_counter() - split_started, len(chunks))
    if not chunks:
        raise PDFMissingError(f"{pdf_path.name} contains no readable text.")
    faiss_started = perf_counter()
    logger.info("[CHAT] FAISS index build started (%s)", pdf_path.name)
    store = FAISS.from_documents(chunks, _get_embeddings())
    logger.info("[CHAT] FAISS index build completed in %.2fs", perf_counter() - faiss_started)
    return store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 5, "fetch_k": 15, "lambda_mult": 0.5},
    )


def get_retriever(kind: str):
    """Return the retriever for 'academic' or 'fee'. Raises PDFMissingError if the PDF is absent."""
    if kind in _retrievers:
        logger.info("[CHAT] retriever cache hit (%s)", kind)
        return _retrievers[kind]
    logger.info("[CHAT] retriever cache miss (%s)", kind)
    pdf_path = DATA_DIR / PDF_FILES[kind]
    if not pdf_path.is_file():
        raise PDFMissingError(
            f"{PDF_FILES[kind]} was not found. Add it to ai-service/data/ and restart the backend."
        )
    retriever = _build_retriever(pdf_path)
    _retrievers[kind] = retriever
    logger.info("[CHAT] retriever initialized (%s)", kind)
    return retriever


def get_academic_retriever():
    return get_retriever("academic")


def get_fee_retriever():
    return get_retriever("fee")
