# CampusAI — Client

React + Vite frontend for CampusAI, with a public landing page at `/` and the existing assistant at `/chat`.

The landing page links into the existing chat experience; chat messages continue to use the FastAPI `/api/chat` endpoint.
Local development uses `VITE_API_URL=http://localhost:8000`. Production builds load `client/.env.production`, which points to the deployed Render backend. Set `FRONTEND_URL` on the backend service to the deployed frontend origin to allow its browser requests through CORS.

```bash
npm install
cp .env.example .env   # set VITE_API_URL if the backend is not on localhost:8000
npm run dev            # http://localhost:5173
npm run build
```
