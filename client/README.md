# CampusAI — Client

React + Vite frontend for CampusAI, with a public landing page at `/` and the existing assistant at `/chat`.

The landing page links into the existing chat experience; chat messages continue to use the FastAPI `/api/chat` endpoint.

```bash
npm install
cp .env.example .env   # set VITE_API_URL if the backend is not on localhost:8000
npm run dev            # http://localhost:5173
npm run build
```
