# 🎓 CampusAI — College AI Assistant

CampusAI is a GenAI-powered college assistant that helps students get answers to academic, fee-related, and general questions using Retrieval-Augmented Generation (RAG).

The project combines React, FastAPI, LangGraph, LangChain, FAISS, Hugging Face embeddings, and Groq LLMs to provide context-aware responses from college documents.

## ✨ Features

- 🤖 AI-powered college assistant
- 📚 Academic information using RAG
- 💰 Fee-related information using RAG
- 🧠 General knowledge questions
- 🔎 Semantic document retrieval with FAISS
- 📄 PDF document processing
- 🏷️ Automatic query classification
- 🔗 LangGraph-based AI workflow
- 💬 Conversational chat interface
- 🎓 Programme selection: BSc IT, BBA, B.Com(H)
- 🌙 Modern dark UI
- ⚡ FastAPI backend
- ⚛️ React + Vite frontend

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │     React Client    │
                    │      Vite + JS      │
                    └──────────┬──────────┘
                               │
                               │ HTTP
                               ▼
                    ┌─────────────────────┐
                    │     FastAPI API     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      LangGraph      │
                    │   Query Classifier  │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
       Academic RAG        Fee RAG          General LLM
             │                 │                 │
             ▼                 ▼                 │
       FAISS Retriever   FAISS Retriever          │
             │                 │                 │
             └─────────────────┴─────────────────┘
                               │
                               ▼
                         Groq LLM
                               │
                               ▼
                         AI Response

🛠️ Tech Stack

Frontend
React
Vite
JavaScript
CSS
Backend
Python
FastAPI
Uvicorn
GenAI
LangGraph
LangChain
Groq
Hugging Face Embeddings
Sentence Transformers
RAG
PyPDFLoader
RecursiveCharacterTextSplitter
FAISS

📂 Project Structure
CampusAI/
│
├── ai-service/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── graph.py
│   │   ├── main.py
│   │   ├── nodes.py
│   │   ├── rag.py
│   │   └── state.py
│   │
│   ├── data/
│   │   ├── academics_handbook.pdf
│   │   └── fee_structure.pdf
│   │
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   └── chatApi.js
│   │   │
│   │   ├── components/
│   │   │   ├── ChatInput.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ThemeToggle.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── README.md
│
├── .gitignore
└── README.md
🔄 How It Works

CampusAI processes a student's question through a LangGraph-based workflow.

1. User Query

The student selects their programme and enters a question.

Example:

What are the attendance requirements?
2. Query Classification

The system classifies the question into:

academic
fee
general
3. Retrieval

For academic and fee-related questions, relevant information is retrieved from college PDF documents using:

PDF document loading
Text chunking
Hugging Face embeddings
FAISS similarity search
4. LLM Processing

The retrieved context is passed to the Groq-powered LLM to generate a response.

5. Response

The final response is returned to the React chat interface along with the detected query type.

📚 RAG Documents

CampusAI uses separate documents for different types of college information.

Academic Handbook

Used for questions related to:

Attendance
Exams
Grading
Credits
Promotion
Course structure
Summer training
Degree requirements
Fee Structure

Used for questions related to:

Tuition fees
Payments
Refunds
Late charges
Scholarships
Other fee-related information

The actual PDF documents are kept locally and are excluded from the Git repository.

⚙️ Installation
Prerequisites

Make sure you have:

Python 3.10+
Node.js
Git
uv
Groq API key
1. Clone the Repository
git clone https://github.com/YOUR_USERNAME/CampusAI-College-Assistant.git
cd CampusAI-College-Assistant
2. Backend Setup
cd ai-service
uv venv
.\.venv\Scripts\Activate.ps1
uv pip install -r requirements.txt
3. Configure Groq API

Create:

ai-service/.env

Add:

GROQ_API_KEY=your_groq_api_key_here

Never commit your real API key to GitHub.

4. Add College Documents

Place the required PDF files inside:

ai-service/data/

Expected files:

ai-service/data/academics_handbook.pdf
ai-service/data/fee_structure.pdf
5. Start the Backend

From the ai-service directory:

uv run uvicorn app.main:app --reload --port 8000

Backend:

http://localhost:8000

Health check:

http://localhost:8000/api/health
6. Frontend Setup

Open a new terminal:

cd client
npm install

Create:

client/.env

Add:

VITE_API_URL=http://localhost:8000

Start the frontend:

npm run dev

Frontend:

http://localhost:5173
🔐 Environment Variables
Backend
GROQ_API_KEY=your_groq_api_key
Frontend
VITE_API_URL=http://localhost:8000

.env files are excluded from Git to protect sensitive credentials.

📡 API
Health Check
GET /api/health

Response:

{
  "status": "ok"
}
Chat
POST /api/chat

Request:

{
  "programme": "BSc IT",
  "message": "What are the attendance requirements?"
}

Response:

{
  "answer": "AI generated response",
  "query_type": "academic"
}
🧠 GenAI Concepts Demonstrated
Generative AI
Retrieval-Augmented Generation (RAG)
Vector search
Embeddings
Semantic similarity search
PDF document ingestion
Query classification
LangGraph workflows
Prompt engineering
LLM integration
FastAPI API development
React frontend integration
🎯 Project Objective

CampusAI demonstrates how institution-specific documents can be combined with modern GenAI techniques to build a practical college AI assistant.

Instead of relying only on general LLM knowledge, the system retrieves relevant information from college documents and uses that context when generating answers.

🚀 Future Improvements
Conversation persistence
Source citations and page references
Streaming responses
Additional college documents
Improved retrieval strategies
Document management interface
Authentication and student profiles
Cloud deployment
👨‍💻 Author

Mohammad Fahim

GenAI Developer | MERN Stack Developer