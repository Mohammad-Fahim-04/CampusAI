import os
import logging
from typing import Literal
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from .graph import campus_graph  # noqa: E402
from .nodes import LLMConfigError, LLMServiceError  # noqa: E402

logger = logging.getLogger(__name__)

app = FastAPI(title="CampusAI")
FRONTEND_URL = (
    os.getenv("FRONTEND_URL") or "http://localhost:5173"
).rstrip("/")
ALLOWED_ORIGINS = list(
    dict.fromkeys(
        [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            FRONTEND_URL,
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    programme: Literal["BCA", "BBA", "B.Com (H)"] = "BCA"
    message: str = Field(min_length=1)
    history: list[ChatHistoryMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    query_type: Literal["academic", "fee", "general"]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"status": "ok", "service": "CampusAI Backend"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    history_messages = []
    seen_current = False
    for item in req.history:
        message_content = item.content.strip()
        if not message_content:
            continue
        if item.role == "user":
            history_messages.append(HumanMessage(content=message_content))
        else:
            history_messages.append(AIMessage(content=message_content))

        if item.role == "user" and message_content == message:
            seen_current = True

    if not seen_current:
        history_messages.append(HumanMessage(content=message))

    try:
        result = campus_graph.invoke(
            {
                "programme": req.programme,
                "messages": history_messages,
                "query_type": "",
                "retrieved_context": "",
            }
        )
    except LLMConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except LLMServiceError as exc:
        raise HTTPException(
            status_code=502,
            detail="The Groq AI service could not complete the request. Check connectivity and model access, then try again.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error handling /api/chat")
        raise HTTPException(
            status_code=500,
            detail="An unexpected backend error occurred. Please try again.",
        ) from exc
    return ChatResponse(
        answer=str(result["messages"][-1].content), query_type=result["query_type"]
    )
