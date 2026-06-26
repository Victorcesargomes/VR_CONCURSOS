# AGENTS.md

## Project overview
VR Concursos — full-stack study tracking app for public exam candidates.
- **Backend**: FastAPI + SQLAlchemy + SQLite (`backend/`)
- **Frontend**: React 18 + Vite + Tailwind CSS 3 + Recharts (`frontend/`)

## Commands

### Setup
```bash
# Backend
cd backend
pip install -r requirements.txt
python seed.py          # 8 matérias, 26 assuntos, 58 tópicos, 400 sessões

# Frontend
cd frontend
npm install
```

### Run (two terminals)
```bash
# Terminal 1 — backend (port 8000)
cd backend
uvicorn main:app --reload

# Terminal 2 — frontend (port 5173, proxies /api → localhost:8000)
cd frontend
npm run dev
```

## Architecture

- **Hierarchy**: Matéria → Assunto → Tópico (3 levels)
- **No individual questions** — users log study sessions with hit/miss counts per topic
- **Weekly calendar** (`plano_semanal`) assigns subjects to days of the week
- Performance uses **% líquido** = (acertos − erros) / total as primary metric
- Classification: Dominado ≥85%, Bom ≥70%, Atenção ≥50%, Crítico <50%

## Key conventions

- Backend routers: `backend/routers/` — one file per resource
- Frontend API calls centralized in `frontend/src/api/index.js`
- Frontend has 3 pages: **Início** (dashboard + calendar + sessions), **Conteúdo** (hierarchy CRUD), **Evolução** (performance drill-down)
- Vite proxy forwards `/api` → `localhost:8000` in dev

## Gotchas

- `seed.py` is idempotent — skips if `Materia` rows exist. Delete `vrconcursos.db` to re-seed.
- `datetime.utcnow` used in models (Python 3.11 compatible). For newer Python, switch to `datetime.now(datetime.UTC)`.
- Enums (`Prioridade`) stored as strings in SQLite. Routers call `.value` when serializing.
- Backend server holds SQLite file lock — stop it before deleting the DB.
