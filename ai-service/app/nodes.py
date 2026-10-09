import os
import re
import logging
from time import perf_counter
from pathlib import Path

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from .memory import log_process_memory
from .rag import PDFMissingError, retrieve_documents
from .state import MAX_HISTORY_MESSAGES, State

logger = logging.getLogger(__name__)

MODEL = "openai/gpt-oss-120b"
NOT_AVAILABLE = "The information is not available in the provided college documents."
PDF_MISSING_PREFIX = "PDF_MISSING:"

_llm = None


class LLMConfigError(Exception):
    """Raised when the Groq API key is not configured."""


class LLMServiceError(Exception):
    """Raised when Groq cannot complete a model request."""


def get_llm():
    global _llm
    if _llm is None:
        if not os.getenv("GROQ_API_KEY"):
            raise LLMConfigError(
                "GROQ_API_KEY is not set. Add it to ai-service/.env and restart the backend."
            )
        from langchain_groq import ChatGroq

        started = perf_counter()
        _llm = ChatGroq(
            model=MODEL,
            temperature=0.4,
            timeout=30,
            max_retries=0,
        )
        logger.info("[CHAT] Groq client initialized in %.2fs", perf_counter() - started)
    return _llm


def _invoke_llm(messages, stage):
    started = perf_counter()
    logger.info("[CHAT] %s LLM started", stage)
    try:
        result = get_llm().invoke(messages)
    except LLMConfigError:
        raise
    except Exception as exc:
        logger.exception(
            "[CHAT] %s LLM failed after %.2fs (%s)",
            stage,
            perf_counter() - started,
            type(exc).__name__,
        )
        raise LLMServiceError from exc
    logger.info("[CHAT] %s LLM completed in %.2fs", stage, perf_counter() - started)
    return result


def _latest_user_text(state: State) -> str:
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            return str(msg.content)
    return ""


def _recent_history(state: State, limit: int = MAX_HISTORY_MESSAGES) -> list:
    messages = [
        msg
        for msg in state["messages"]
        if isinstance(msg, (HumanMessage, AIMessage))
    ]
    latest_user_index = next(
        (index for index in range(len(messages) - 1, -1, -1)
         if isinstance(messages[index], HumanMessage)),
        len(messages),
    )
    return messages[:latest_user_index][-limit:]


def normalize_query_type(raw: str) -> str:
    """Map any model output to exactly 'academic', 'fee' or 'general'."""
    match = re.search(r"\b(academic|fee|general)\b", (raw or "").lower())
    return match.group(1) if match else "general"


CLASSIFIER_PROMPT = """Classify the student's question into exactly one category.

academic: attendance, exams, grading, credits, promotion, course structure, summer training, degree requirements, academic rules
fee: fees, tuition, payment, refund, late charges, scholarships, money-related college questions
general: greetings, casual conversation, anything else

Use recent conversation only to resolve references and follow-up intent. Classify the
current question in that context; do not let an unrelated earlier topic override it.
Clearly academic or fee-related questions remain in that category even if the documents
may not contain the answer. Reply with only one word: academic, fee, or general."""


def classifier(state: State) -> dict:
    started = perf_counter()
    logger.info("[CHAT] classifier started")
    history = _recent_history(state)
    history_text = "\n".join(
        f"{'Previous user' if isinstance(msg, HumanMessage) else 'Previous assistant'}: {msg.content}"
        for msg in history
    )
    current_question = _latest_user_text(state)
    question_with_context = (
        f"Recent conversation:\n{history_text}\n\nCurrent user question:\n{current_question}"
        if history_text
        else current_question
    )
    reply = _invoke_llm(
        [SystemMessage(content=CLASSIFIER_PROMPT), HumanMessage(content=question_with_context)],
        "classifier",
    )
    query_type = normalize_query_type(reply.content)
    logger.info(
        "[CHAT] classifier completed in %.2fs (query_type=%s)",
        perf_counter() - started,
        query_type,
    )
    return {"query_type": query_type}


def route_query(state: State) -> str:
    query_type = state["query_type"]
    logger.info("[CHAT] graph route selected (category=%s)", query_type)
    return query_type


def _retrieve(kind: str, state: State) -> dict:
    started = perf_counter()
    logger.info("[CHAT] RAG started")
    log_process_memory(f"RAG request started ({kind})")
    try:
        query = _latest_user_text(state)
        if re.search(
            r"\b(?:that|this|it|those|these|them|they|there|less|more|such|"
            r"what about|what happens|what if|how much)\b",
            query,
            re.IGNORECASE,
        ):
            history = _recent_history(state)
            if history:
                history_text = "\n".join(
                    f"{'User' if isinstance(msg, HumanMessage) else 'Assistant'}: {msg.content}"
                    for msg in history
                )
                query = (
                    f"Recent conversation:\n{history_text}\n\n"
                    f"Current user question: {query}"
                )
        docs = retrieve_documents(kind, query)
    except PDFMissingError as exc:
        logger.warning("[CHAT] RAG failed after %.2fs (PDF unavailable)", perf_counter() - started)
        log_process_memory(f"RAG request failed ({kind})")
        return {"retrieved_context": f"{PDF_MISSING_PREFIX} {exc}"}
    except Exception:
        logger.exception("[CHAT] RAG failed after %.2fs", perf_counter() - started)
        log_process_memory(f"RAG request failed ({kind})")
        raise

    logger.info("[CHAT] RAG completed in %.2fs (documents=%d)", perf_counter() - started, len(docs))
    log_process_memory(f"RAG request finished ({kind})")
    formatted_docs = []
    for doc in docs:
        metadata = doc.metadata
        details = []
        source = metadata.get("source")
        if source:
            source_name = Path(str(source).replace("\\", "/")).name
            details.append(f"Source: {source_name}")
        page = metadata.get("page")
        if page is not None:
            details.append(f"Page: {page}")
        header = f"[{' | '.join(details)}]\n\n" if details else ""
        formatted_docs.append(f"{header}{doc.page_content}")
    return {"retrieved_context": "\n\n".join(formatted_docs)}


def academic_rag(state: State) -> dict:
    return _retrieve("academic", state)


def fee_rag(state: State) -> dict:
    return _retrieve("fee", state)


def general(state: State) -> dict:
    return {"retrieved_context": "NO_RETRIEVAL_NEEDED"}


def response(state: State) -> dict:
    started = perf_counter()
    context = state["retrieved_context"]
    query_type = state["query_type"]
    programme = state["programme"]
    logger.info(
        "[CHAT] response generation started (category=%s, context_chars=%d)",
        query_type,
        len(context),
    )

    if context.startswith(PDF_MISSING_PREFIX):
        logger.info("[CHAT] response generated in %.2fs (PDF unavailable)", perf_counter() - started)
        return {"messages": [AIMessage(content=context[len(PDF_MISSING_PREFIX):].strip())]}

    if query_type == "general":
        system = (
            "You are CampusAI, a friendly college assistant. "
            f"The student is in the {programme} programme; use that when relevant. "
            "Answer helpfully and concisely. Do not invent college-specific facts "
            "(policies, fees, dates) you cannot know."
        )
    else:
        system = (
            "You are CampusAI, a college assistant. "
            f"The student is in the {programme} programme. "
            "Answer ONLY from the official college document context below. "
            "Do not invent college-specific information. "
        )
        if programme == "BSc IT":
            system += (
                "\n\nThe retrieved BSc IT material may include an 'EDITED DRAFT' "
                "notice stating that course codes, fee figures, and institutional "
                "details have not been independently verified. Do not give those "
                "details as official facts. If the requested detail is present in "
                "that draft, answer with the value or wording shown, label that "
                "specific detail as unverified draft information, and say exactly "
                "what should be confirmed with the college. If the question asks "
                "about information not present or not clear in the context, identify "
                "what is missing or ambiguous instead of returning a generic warning. "
                "A draft notice about one detail does not justify withholding a "
                "different directly supported answer. If a detail is missing or "
                "ambiguous, identify that specific gap and what needs confirmation."
            )
        else:
            system += (
                f'If the answer is not in the context, reply exactly: "{NOT_AVAILABLE}"'
            )
        system += f"\n\nContext:\n{context}"

    history = [m for m in state["messages"] if isinstance(m, (HumanMessage, AIMessage))]
    reply = _invoke_llm(
        [SystemMessage(content=system)] + history[-(MAX_HISTORY_MESSAGES + 1):],
        "response",
    )
    logger.info("[CHAT] response generated in %.2fs", perf_counter() - started)
    return {"messages": [AIMessage(content=reply.content)]}
