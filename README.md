# CampusAI — College AI Assistant

Students pick a programme (BCA, BBA, B.Com (H)) and ask about academics, fees, or general campus topics. A LangGraph backend classifies each question and routes it to academic RAG, fee RAG, or a general LLM. No login, no database.

```
CampusAI/
├── client/       React + Vite chat UI
└── ai-service/   FastAPI + LangGraph backend
```

## Run

Backend:
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env        # set GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

## PDFs
Add `academics_handbook.pdf` and `fee_structure.pdf` to `ai-service/data/`, then restart the backend. See `ai-service/README.md`.
