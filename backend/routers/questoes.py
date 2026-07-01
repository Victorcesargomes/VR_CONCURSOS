from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Assunto, Questao, SessaoEstudo, Topico
from schemas import QuestaoCreate, QuestaoResponse

router = APIRouter(prefix="/api/questoes", tags=["questoes"])


def _format(q: Questao) -> dict:
    topico = q.topico
    return {
        "id": q.id,
        "sessao_id": q.sessao_id,
        "topico_id": q.topico_id,
        "numero": q.numero,
        "banca": q.banca,
        "ano": q.ano,
        "prova_origem": q.prova_origem,
        "gabarito": q.gabarito,
        "resposta": q.resposta,
        "acertou": q.acertou,
        "observacao": q.observacao,
        "created_at": q.created_at,
        "topico_nome": topico.nome if topico else None,
        "assunto_nome": topico.assunto.nome if topico else None,
        "materia_nome": topico.assunto.materia.nome if topico else None,
    }


def _apply_filters(query, sessao_id=None, topico_id=None, materia_id=None, acertou=None):
    if sessao_id:
        query = query.filter(Questao.sessao_id == sessao_id)
    if topico_id:
        query = query.filter(Questao.topico_id == topico_id)
    if materia_id:
        query = query.join(Topico).join(Assunto).filter(Assunto.materia_id == materia_id)
    if acertou is not None:
        query = query.filter(Questao.acertou.is_(acertou))
    return query


@router.get("/", response_model=list[QuestaoResponse])
def listar(
    sessao_id: int = Query(None),
    topico_id: int = Query(None),
    materia_id: int = Query(None),
    acertou: bool | None = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    query = _apply_filters(db.query(Questao), sessao_id, topico_id, materia_id, acertou)
    query = query.order_by(Questao.created_at.desc())
    return [_format(q) for q in query.offset(offset).limit(limit).all()]


@router.get("/caderno-erros", response_model=list[QuestaoResponse])
def caderno_erros(
    materia_id: int = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """Visão do caderno de erros: questões com acertou=False."""
    query = _apply_filters(db.query(Questao), materia_id=materia_id, acertou=False)
    query = query.order_by(Questao.created_at.desc())
    return [_format(q) for q in query.offset(offset).limit(limit).all()]


@router.post("/", response_model=QuestaoResponse, status_code=201)
def criar(data: QuestaoCreate, db: Session = Depends(get_db)):
    if not data.sessao_id:
        raise HTTPException(status_code=422, detail="sessao_id é obrigatório")
    sessao = db.query(SessaoEstudo).filter(SessaoEstudo.id == data.sessao_id).first()
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    topico_id = data.topico_id or sessao.topico_id
    if data.topico_id and data.topico_id != sessao.topico_id:
        raise HTTPException(status_code=422, detail="topico_id deve corresponder ao tópico da sessão")
    q = Questao(
        sessao_id=data.sessao_id, topico_id=topico_id, numero=data.numero,
        banca=data.banca, ano=data.ano, prova_origem=data.prova_origem,
        gabarito=data.gabarito, resposta=data.resposta, acertou=data.acertou,
        observacao=data.observacao, created_at=datetime.utcnow(),
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return _format(q)


@router.put("/{questao_id}", response_model=QuestaoResponse)
def atualizar(questao_id: int, data: QuestaoCreate, db: Session = Depends(get_db)):
    q = db.query(Questao).filter(Questao.id == questao_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada")
    for key in ("numero, banca, ano, prova_origem, gabarito, resposta, acertou, observacao").split(", "):
        value = getattr(data, key)
        if value is not None:
            setattr(q, key, value)
    db.commit()
    db.refresh(q)
    return _format(q)


@router.delete("/{questao_id}", status_code=204)
def excluir(questao_id: int, db: Session = Depends(get_db)):
    q = db.query(Questao).filter(Questao.id == questao_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada")
    db.delete(q)
    db.commit()
