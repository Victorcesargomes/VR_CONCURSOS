from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from migrations import run_sqlite_migrations
from routers import materias, assuntos, topicos, calendario, sessoes, desempenho, revisoes, editais, metas, questoes, engajamento
from study_rules import backfill_reviews

Base.metadata.create_all(bind=engine)
run_sqlite_migrations(engine)
with SessionLocal() as db:
    backfill_reviews(db)

app = FastAPI(title="VR Concursos API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(materias.router)
app.include_router(assuntos.router)
app.include_router(topicos.router)
app.include_router(calendario.router)
app.include_router(sessoes.router)
app.include_router(desempenho.router)
app.include_router(revisoes.router)
app.include_router(editais.router)
app.include_router(metas.router)
app.include_router(questoes.router)
app.include_router(engajamento.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "VR Concursos"}
