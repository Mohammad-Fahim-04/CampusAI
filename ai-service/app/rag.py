"""PDF-backed retrievers. Built lazily so the app starts even when PDFs are missing."""
import logging
import re
import threading
from time import perf_counter
from pathlib import Path

from langchain_core.embeddings import Embeddings

from .memory import log_process_memory

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

PDF_FILES = {
    "academic": "academics_handbook.pdf",
    "fee": "fee_structure.pdf",
}

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_THREADS = 1
CHUNK_SIZE = 700
CHUNK_OVERLAP = 120
CHUNK_SEPARATORS = ("\n\n", "\n", " ", "")

_embeddings = None
_retrievers = {}
_initialization_lock = threading.RLock()


class FastEmbedEmbeddings(Embeddings):
    def __init__(self):
        from fastembed import TextEmbedding

        self._model = TextEmbedding(
            model_name=EMBEDDING_MODEL,
            threads=EMBEDDING_THREADS,
        )

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [
            embedding.tolist()
            for embedding in self._model.embed(texts, batch_size=1)
        ]

    def embed_query(self, text: str) -> list[float]:
        return next(self._model.query_embed(text)).tolist()


class PDFMissingError(Exception):
    """Raised when a required PDF is not in ai-service/data/."""


def _split_with_separator(text: str, separator: str) -> list[str]:
    if not separator:
        return list(text)
    parts = re.split(f"({re.escape(separator)})", text)
    splits = [parts[0]]
    splits.extend(parts[index] + parts[index + 1] for index in range(1, len(parts), 2))
    if len(parts) % 2 == 0:
        splits.extend(parts[-1:])
    return [split for split in splits if split]


def _merge_splits(splits: list[str]) -> list[str]:
    documents = []
    current: list[str] = []
    total = 0
    for split in splits:
        split_length = len(split)
        if total + split_length > CHUNK_SIZE:
            if current:
                document = "".join(current).strip()
                if document:
                    documents.append(document)
                while total > CHUNK_OVERLAP or (total + split_length > CHUNK_SIZE and total > 0):
                    total -= len(current[0])
                    current = current[1:]
        current.append(split)
        total += split_length
    document = "".join(current).strip()
    if document:
        documents.append(document)
    return documents


def _recursive_split(text: str, separators: tuple[str, ...] = CHUNK_SEPARATORS) -> list[str]:
    separator = separators[-1]
    remaining_separators: tuple[str, ...] = ()
    for index, candidate in enumerate(separators):
        if not candidate:
            separator = ""
            break
        if re.search(re.escape(candidate), text):
            separator = candidate
            remaining_separators = separators[index + 1 :]
            break

    good_splits = []
    final_chunks = []
    for split in _split_with_separator(text, separator):
        if len(split) < CHUNK_SIZE:
            good_splits.append(split)
            continue
        if good_splits:
            final_chunks.extend(_merge_splits(good_splits))
            good_splits = []
        if not remaining_separators:
            final_chunks.append(split)
        else:
            final_chunks.extend(_recursive_split(split, remaining_separators))
    if good_splits:
        final_chunks.extend(_merge_splits(good_splits))
    return final_chunks


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        with _initialization_lock:
            if _embeddings is None:
                started = perf_counter()
                logger.info("[CHAT] embedding model initialization started")
                log_process_memory("before embedding model initialization")
                _embeddings = FastEmbedEmbeddings()
                logger.info(
                    "[CHAT] FastEmbed model initialized in %.2fs (model=%s, threads=%d)",
                    perf_counter() - started,
                    EMBEDDING_MODEL,
                    EMBEDDING_THREADS,
                )
                log_process_memory("after embedding model initialization")
    return _embeddings


def _build_retriever(pdf_path: Path):
    import faiss
    from langchain_community.vectorstores import FAISS
    from langchain_core.documents import Document
    from pypdf import PdfReader

    faiss.omp_set_num_threads(1)
    pdf_started = perf_counter()
    logger.info("[CHAT] PDF loading started (%s)", pdf_path.name)
    log_process_memory(f"before PDF load ({pdf_path.name})")
    try:
        reader = PdfReader(str(pdf_path))
        page_count = len(reader.pages)
        pages = [
            Document(
                page_content=page.extract_text() or "",
                metadata={
                    "source": str(pdf_path),
                    "page": page_number,
                    "page_label": reader.page_labels[page_number],
                    "total_pages": page_count,
                },
            )
            for page_number, page in enumerate(reader.pages)
        ]
    except Exception as exc:
        logger.exception("[CHAT] PDF loading failed (%s)", pdf_path.name)
        raise PDFMissingError(
            f"{pdf_path.name} could not be read. Check that it is a valid, readable PDF."
        ) from exc
    logger.info(
        "[CHAT] PDF loaded in %.2fs (%s, pages=%d)",
        perf_counter() - pdf_started,
        pdf_path.name,
        page_count,
    )
    log_process_memory(f"after PDF load ({pdf_path.name})")
    split_started = perf_counter()
    chunks = [
        Document(page_content=chunk, metadata=page.metadata)
        for page in pages
        for chunk in _recursive_split(page.page_content)
    ]
    logger.info("[CHAT] document splitting completed in %.2fs (chunks=%d)", perf_counter() - split_started, len(chunks))
    del pages
    del reader
    log_process_memory(f"after document splitting ({pdf_path.name})")
    if not chunks:
        raise PDFMissingError(f"{pdf_path.name} contains no readable text.")
    faiss_started = perf_counter()
    logger.info("[CHAT] FAISS index build started (%s)", pdf_path.name)
    log_process_memory(f"before FAISS index build ({pdf_path.name})")
    store = FAISS.from_documents(chunks, _get_embeddings())
    logger.info(
        "[CHAT] FAISS index build completed in %.2fs (%s, vectors=%d, vector_payload~%.2f MiB)",
        perf_counter() - faiss_started,
        pdf_path.name,
        store.index.ntotal,
        store.index.ntotal * store.index.d * 4 / (1024 * 1024),
    )
    log_process_memory(f"after FAISS index build ({pdf_path.name})")
    return store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 5, "fetch_k": 15, "lambda_mult": 0.5},
    )


def get_retriever(kind: str):
    """Return the retriever for 'academic' or 'fee'. Raises PDFMissingError if the PDF is absent."""
    if kind in _retrievers:
        logger.info("[CHAT] retriever cache hit (%s)", kind)
        return _retrievers[kind]
    with _initialization_lock:
        if kind in _retrievers:
            logger.info("[CHAT] retriever cache hit (%s)", kind)
            return _retrievers[kind]
        logger.info("[CHAT] retriever cache miss (%s)", kind)
        for cached_kind in tuple(_retrievers):
            if cached_kind != kind:
                del _retrievers[cached_kind]
                logger.info("[MEMORY] evicted FAISS retriever (%s)", cached_kind)
                log_process_memory(f"after FAISS cache eviction ({cached_kind})")
        pdf_path = DATA_DIR / PDF_FILES[kind]
        if not pdf_path.is_file():
            raise PDFMissingError(
                f"{PDF_FILES[kind]} was not found. Add it to ai-service/data/ and restart the backend."
            )
        retriever = _build_retriever(pdf_path)
        _retrievers[kind] = retriever
        logger.info("[CHAT] retriever initialized (%s)", kind)
        return retriever


def retrieve_documents(kind: str, query: str):
    """Run retrieval while preventing simultaneous indexes from being retained."""
    with _initialization_lock:
        return get_retriever(kind).invoke(query)


def get_academic_retriever():
    return get_retriever("academic")


def get_fee_retriever():
    return get_retriever("fee")
