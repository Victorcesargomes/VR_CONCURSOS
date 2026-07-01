from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Revisao

router = APIRouter(prefix="/api/revisoes", tags=["revisoes"])


def _today_bounds():
    now = datetime.utcnow()
    start = datetime(now.year, now.month, now.day)
    return start, start + timedelta(days=1)


def _format(r):
    today_start, _ = _today_bounds()
    dias_atraso = max((today_start.date() - r.data_prevista.date()).days, 0)
    topico = r.topico
    assunto = topico.assunto if topico else None
    materia = assunto.materia if assunto else None
    return {
        "id": r.id,
        "topico_id": r.topico_id,
        "topico_nome": topico.nome if topico else None,
        "assunto_nome": assunto.nome if assunto else None,
        "materia_nome": materia.nome if materia else None,
        "data_prevista": r.data_prevista,
        "status": r.status,
        "etapa": r.etapa,
        "motivo": r.motivo,
        "percentual_liquido_origem": r.percentual_liquido_origem or 0,
        "dias_atraso": dias_atraso,
        "prioridade": topico.prioridade.value if topico and topico.prioridade else "media",
        "peso": (topico.peso or 1) if topico else 1,
    }


@router.get("/")
def listar(
    status: str = Query("pendente"),
    somente_vencidas: bool = Query(False),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Revisao)
    if status != "todas":
        query = query.filter(Revisao.status == status)

    if somente_vencidas:
        _, today_end = _today_bounds()
        query = query.filter(Revisao.data_prevista < today_end)

    revisoes = query.order_by(
        Revisao.data_prevista.asc(),
        Revisao.percentual_liquido_origem.asc(),
    ).limit(limit).all()

    # Ignora revisões órfãs (topico/assunto removidos) para não quebrar a listagem
    return [_format(r) for r in revisoes if r.topico and r.topico.assunto]


@router.get("/resumo")
def resumo(db: Session = Depends(get_db)):
    today_start, today_end = _today_bounds()

    pendentes = db.query(Revisao).filter(Revisao.status == "pendente")
    atrasadas = pendentes.filter(Revisao.data_prevista < today_start).count()
    hoje = db.query(Revisao).filter(
        Revisao.status == "pendente",
        Revisao.data_prevista >= today_start,
        Revisao.data_prevista < today_end,
    ).count()
    proximas = db.query(Revisao).filter(
        Revisao.status == "pendente",
        Revisao.data_prevista >= today_end,
    ).count()

    return {
        "hoje": hoje,
        "atrasadas": atrasadas,
        "proximas": proximas,
        "total_pendentes": atrasadas + hoje + proximas,
    }


@router.put("/{id}/concluir")
def concluir(id: int, db: Session = Depends(get_db)):
    revisao = db.query(Revisao).filter(Revisao.id == id).first()
    if not revisao:
        raise HTTPException(status_code=404, detail="Revisao nao encontrada")

    revisao.status = "concluida"
    revisao.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(revisao)
    return _format(revisao)
