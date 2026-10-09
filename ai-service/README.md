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

## Render Free deployment

- Root directory: `ai-service`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`

## API
- `GET /api/health` → `{"status": "ok"}`
- `POST /api/chat` with `{"programme": "BSc IT", "message": "..."}` → `{"answer": "...", "query_type": "academic|fee|general"}`
- `POST /api/chat` can also include conversation history:
  ```json
  {
    "programme": "BSc IT",
    "message": "What happens if I don't meet them?",
    "history": [
      {"role": "user", "content": "What are the attendance requirements?"},
      {"role": "assistant", "content": "..."}
    ]
  }
  ```

The first academic/fee question downloads and initializes the ONNX Runtime embedding model (`all-MiniLM-L6-v2`) and builds its FAISS index, so it takes longer. The same FastEmbed model instance embeds both indexed document chunks and user queries; the FAISS index is built from that runtime on first use and is never loaded with vectors from another model.

For memory-limited deployments, only the most recently used document index is kept in memory; switching categories evicts the previous index and rebuilds it if needed. The service logs process RSS and peak RSS with `[MEMORY]` markers. Keep a single Uvicorn worker on a 512 MiB instance.
