from dataclasses import asdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from engajamento import avaliar, compute_stats, meta_diaria_progress, meta_global, todas_conquistas

router = APIRouter(prefix="/api/engajamento", tags=["engajamento"])


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    meta = meta_global(db)
    s = compute_stats(db, meta)
    return {**asdict(s), "meta_hoje": meta_diaria_progress(db, meta)}


@router.get("/conquistas")
def conquistas(db: Session = Depends(get_db)):
    return todas_conquistas(db)


@router.post("/conquistas/avaliar")
def avaliar_endpoint(db: Session = Depends(get_db)):
    return avaliar(db, meta_global(db))
