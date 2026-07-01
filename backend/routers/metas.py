from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Meta
from readiness import META_DEFAULTS
from schemas import MetaBase, MetaResponse

router = APIRouter(prefix="/api/metas", tags=["metas"])


def _format(m: Meta) -> dict:
    return {
        "id": m.id,
        "edital_id": m.edital_id,
        "questoes_por_dia": m.questoes_por_dia,
        "questoes_por_semana": m.questoes_por_semana,
        "minutos_por_dia": m.minutos_por_dia,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }


def _buscar(db: Session, edital_id: int | None) -> Meta | None:
    if edital_id:
        return db.query(Meta).filter(Meta.edital_id == edital_id).first()
    return db.query(Meta).filter(Meta.edital_id.is_(None)).first()


@router.get("/", response_model=MetaResponse)
def obter(edital_id: int | None = Query(None), db: Session = Depends(get_db)):
    m = _buscar(db, edital_id)
    if not m:
        # devolve defaults sem persistir
        return {
            "id": 0,
            "edital_id": edital_id,
            **META_DEFAULTS,
            "created_at": None,
            "updated_at": None,
        }
    return _format(m)


@router.put("/", response_model=MetaResponse)
def upsert(data: MetaBase, db: Session = Depends(get_db)):
    edital_id = data.edital_id
    m = _buscar(db, edital_id)
    if m:
        m.questoes_por_dia = data.questoes_por_dia
        m.questoes_por_semana = data.questoes_por_semana
        m.minutos_por_dia = data.minutos_por_dia
    else:
        m = Meta(
            edital_id=edital_id,
            questoes_por_dia=data.questoes_por_dia,
            questoes_por_semana=data.questoes_por_semana,
            minutos_por_dia=data.minutos_por_dia,
        )
        db.add(m)
    db.commit()
    db.refresh(m)
    return _format(m)
