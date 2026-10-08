# CampusAI — AI Service

FastAPI + LangGraph backend. Classifies each question and routes it to academic RAG, fee RAG, or a general LLM (Groq `openai/gpt-oss-120b`).

## Setup
```bash
pip install -r requirements.txt
cp .env.example .env      # then set GROQ_API_KEY
```
Put your PDFs in `data/`:
- `academics_handbook.pdf`
- `fee_structure.pdf`

Restart the backend after adding them. Until then, `/api/health` and general questions work, and academic/fee questions return a message saying which PDF is missing.

## Run
```bash
uvicorn app.main:app --reload --port 8000
```

## API
- `GET /api/health` → `{"status": "ok"}`
- `POST /api/chat` with `{"programme": "BCA", "message": "..."}` → `{"answer": "...", "query_type": "academic|fee|general"}`
- `POST /api/chat` can also include conversation history:
  ```json
  {
    "programme": "BCA",
    "message": "What happens if I don't meet them?",
    "history": [
      {"role": "user", "content": "What are the attendance requirements?"},
      {"role": "assistant", "content": "..."}
    ]
  }
  ```

The first academic/fee question builds the FAISS index and downloads the embedding model (`all-MiniLM-L6-v2`), so it takes longer.
