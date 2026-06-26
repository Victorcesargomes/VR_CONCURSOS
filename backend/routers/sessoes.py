from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import SessaoEstudo
from schemas import SessaoEstudoCreate, SessaoEstudoResponse
from study_rules import complete_review, schedule_reviews

router = APIRouter(prefix="/api/sessoes", tags=["sessoes"])


def _parse_date(value: str | None, end: bool = False):
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if len(value) == 10 and end:
        return parsed + timedelta(days=1)
    return parsed


def _format(s):
    return {
        "id": s.id, "topico_id": s.topico_id, "data": s.data,
        "tipo": s.tipo or "estudo",
        "questoes_feitas": s.questoes_feitas, "acertos": s.acertos, "erros": s.erros,
        "observacoes": s.observacoes, "resumo_feito": s.resumo_feito,
        "topico_nome": s.topico.nome,
        "assunto_nome": s.topico.assunto.nome,
        "materia_nome": s.topico.assunto.materia.nome,
    }


@router.get("/", response_model=list[SessaoEstudoResponse])
def listar(
    topico_id: int = Query(None),
    materia_id: int = Query(None),
    assunto_id: int = Query(None),
    data_inicio: str = Query(None),
    data_fim: str = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    query = db.query(SessaoEstudo)
    if topico_id:
        query = query.filter(SessaoEstudo.topico_id == topico_id)
    if assunto_id or materia_id:
        from models import Assunto, Topico
        query = query.join(Topico).join(Assunto)
        if assunto_id:
            query = query.filter(Topico.assunto_id == assunto_id)
        if materia_id:
            query = query.filter(Assunto.materia_id == materia_id)
    start = _parse_date(data_inicio)
    end = _parse_date(data_fim, end=True)
    if start:
        query = query.filter(SessaoEstudo.data >= start)
    if end:
        query = query.filter(SessaoEstudo.data < end)
    sessoes = query.order_by(SessaoEstudo.data.desc()).offset(offset).limit(limit).all()
    return [_format(s) for s in sessoes]


@router.get("/{id}", response_model=SessaoEstudoResponse)
def obter(id: int, db: Session = Depends(get_db)):
    s = db.query(SessaoEstudo).filter(SessaoEstudo.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    return _format(s)


@router.post("/", response_model=SessaoEstudoResponse, status_code=201)
def criar(data: SessaoEstudoCreate, db: Session = Depends(get_db)):
    sessao_data = data.model_dump()
    revisao_id = sessao_data.pop("revisao_id", None)
    if not sessao_data.get("data"):
        sessao_data["data"] = datetime.utcnow()
    s = SessaoEstudo(**sessao_data)
    db.add(s)
    db.commit()
    db.refresh(s)
    complete_review(db, revisao_id, s.id)
    schedule_reviews(db, s)
    db.commit()
    db.refresh(s)
    return _format(s)


@router.put("/{id}", response_model=SessaoEstudoResponse)
def atualizar(id: int, data: SessaoEstudoCreate, db: Session = Depends(get_db)):
    s = db.query(SessaoEstudo).filter(SessaoEstudo.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    sessao_data = data.model_dump()
    sessao_data.pop("revisao_id", None)
    for key, value in sessao_data.items():
        setattr(s, key, value)
    db.commit()
    db.refresh(s)
    return _format(s)


@router.delete("/{id}", status_code=204)
def excluir(id: int, db: Session = Depends(get_db)):
    s = db.query(SessaoEstudo).filter(SessaoEstudo.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    db.delete(s)
    db.commit()
