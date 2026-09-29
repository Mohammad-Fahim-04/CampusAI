import os
import re

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from .rag import PDFMissingError, get_academic_retriever, get_fee_retriever
from .state import State

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

        _llm = ChatGroq(model=MODEL, temperature=0.4)
    return _llm


def _invoke_llm(messages):
    try:
        return get_llm().invoke(messages)
    except LLMConfigError:
        raise
    except Exception as exc:
        raise LLMServiceError from exc


def _latest_user_text(state: State) -> str:
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            return str(msg.content)
    return ""


def normalize_query_type(raw: str) -> str:
    """Map any model output to exactly 'academic', 'fee' or 'general'."""
    match = re.search(r"\b(academic|fee|general)\b", (raw or "").lower())
    return match.group(1) if match else "general"


CLASSIFIER_PROMPT = """Classify the student's question into exactly one category.

academic: attendance, exams, grading, credits, promotion, course structure, summer training, degree requirements, academic rules
fee: fees, tuition, payment, refund, late charges, scholarships, money-related college questions
general: greetings, casual conversation, anything else

Reply with only one word: academic, fee, or general."""


def classifier(state: State) -> dict:
    reply = _invoke_llm(
        [SystemMessage(content=CLASSIFIER_PROMPT), HumanMessage(content=_latest_user_text(state))]
    )
    return {"query_type": normalize_query_type(reply.content)}


def route_query(state: State) -> str:
    return state["query_type"]


def _retrieve(get_retriever, state: State) -> dict:
    try:
        docs = get_retriever().invoke(_latest_user_text(state))
    except PDFMissingError as exc:
        return {"retrieved_context": f"{PDF_MISSING_PREFIX} {exc}"}
    return {"retrieved_context": "\n\n".join(d.page_content for d in docs)}


def academic_rag(state: State) -> dict:
    return _retrieve(get_academic_retriever, state)


def fee_rag(state: State) -> dict:
    return _retrieve(get_fee_retriever, state)


def general(state: State) -> dict:
    return {"retrieved_context": "NO_RETRIEVAL_NEEDED"}


def response(state: State) -> dict:
    context = state["retrieved_context"]
    query_type = state["query_type"]
    programme = state["programme"]

    if context.startswith(PDF_MISSING_PREFIX):
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
            f'If the answer is not in the context, reply exactly: "{NOT_AVAILABLE}"\n\n'
            f"Context:\n{context}"
        )

    history = [m for m in state["messages"] if isinstance(m, (HumanMessage, AIMessage))]
    reply = _invoke_llm([SystemMessage(content=system)] + history[-6:])
    return {"messages": [AIMessage(content=reply.content)]}
