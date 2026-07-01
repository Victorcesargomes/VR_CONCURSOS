from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from csv_export import to_csv
from database import get_db
from engajamento import avaliar, meta_global
from models import Assunto, Questao, SessaoEstudo, Topico
from schemas import FinalizarSimuladoPayload, SessaoEstudoCreate, SessaoEstudoResponse
from study_rules import complete_review, schedule_reviews, score_simulado, sync_sessao_from_questoes

router = APIRouter(prefix="/api/sessoes", tags=["sessoes"])


def _parse_date(value: str | None, end: bool = False):
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if len(value) == 10 and end:
        return parsed + timedelta(days=1)
    return parsed


def _format(s, novas_conquistas=None):
    return {
        "id": s.id, "topico_id": s.topico_id, "data": s.data,
        "tipo": s.tipo or "estudo",
        "questoes_feitas": s.questoes_feitas, "acertos": s.acertos, "erros": s.erros,
        "observacoes": s.observacoes, "resumo_feito": s.resumo_feito,
        "duracao_segundos": s.duracao_segundos,
        "total_questoes": len(s.questoes) if s.questoes else 0,
        "topico_nome": s.topico.nome,
        "assunto_nome": s.topico.assunto.nome,
        "materia_nome": s.topico.assunto.materia.nome,
        "novas_conquistas": novas_conquistas or [],
    }


def _listar_query(db, topico_id=None, materia_id=None, assunto_id=None, tipos=None, data_inicio=None, data_fim=None):
    query = db.query(SessaoEstudo)
    if topico_id:
        query = query.filter(SessaoEstudo.topico_id == topico_id)
    if tipos:
        query = query.filter(SessaoEstudo.tipo.in_(tipos))
    if assunto_id or materia_id:
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
    return query.order_by(SessaoEstudo.data.desc())


@router.get("/", response_model=list[SessaoEstudoResponse])
def listar(
    topico_id: int = Query(None),
    materia_id: int = Query(None),
    assunto_id: int = Query(None),
    tipos: list[str] | None = Query(None),
    data_inicio: str = Query(None),
    data_fim: str = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    sessoes = _listar_query(db, topico_id, materia_id, assunto_id, tipos, data_inicio, data_fim).offset(offset).limit(limit).all()
    return [_format(s) for s in sessoes]


@router.get("/export.csv")
def exportar_csv(
    topico_id: int = Query(None),
    materia_id: int = Query(None),
    assunto_id: int = Query(None),
    tipos: list[str] | None = Query(None),
    data_inicio: str = Query(None),
    data_fim: str = Query(None),
    db: Session = Depends(get_db),
):
    sessoes = _listar_query(db, topico_id, materia_id, assunto_id, tipos, data_inicio, data_fim).limit(5000).all()
    rows = [_format(s) for s in sessoes]
    columns = ["data", "tipo", "materia_nome", "assunto_nome", "topico_nome",
               "questoes_feitas", "acertos", "erros", "duracao_segundos", "observacoes"]
    return Response(
        content=to_csv(rows, columns),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sessoes.csv"},
    )


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
    questoes_data = sessao_data.pop("questoes", []) or []
    if not sessao_data.get("data"):
        sessao_data["data"] = datetime.utcnow()
    s = SessaoEstudo(**sessao_data)
    db.add(s)
    db.commit()
    db.refresh(s)

    # Caminho de simulado/auto-correção: cria as Questao e recalcula agregados
    if questoes_data:
        for i, q in enumerate(questoes_data, start=1):
            db.add(Questao(
                sessao_id=s.id,
                topico_id=q.get("topico_id") or s.topico_id,
                numero=q.get("numero") if q.get("numero") is not None else i,
                banca=q.get("banca"), ano=q.get("ano"), prova_origem=q.get("prova_origem"),
                gabarito=q.get("gabarito"), resposta=q.get("resposta"),
                acertou=q.get("acertou"), observacao=q.get("observacao"),
            ))
        db.commit()
        db.refresh(s)
        sync_sessao_from_questoes(db, s)
        db.commit()
        db.refresh(s)

    complete_review(db, revisao_id, s.id)
    schedule_reviews(db, s)
    db.commit()
    db.refresh(s)

    # Desbloqueia conquistas sem jamais bloquear a criação da sessão
    novas_conquistas = []
    try:
        novas_conquistas = avaliar(db, meta_global(db))
    except Exception:
        pass

    return _format(s, novas_conquistas)


@router.put("/{id}", response_model=SessaoEstudoResponse)
def atualizar(id: int, data: SessaoEstudoCreate, db: Session = Depends(get_db)):
    s = db.query(SessaoEstudo).filter(SessaoEstudo.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    sessao_data = data.model_dump()
    sessao_data.pop("revisao_id", None)
    sessao_data.pop("questoes", None)
    for key, value in sessao_data.items():
        setattr(s, key, value)
    db.commit()
    db.refresh(s)
    return _format(s)


@router.post("/{id}/finalizar-simulado", response_model=SessaoEstudoResponse)
def finalizar_simulado(id: int, payload: FinalizarSimuladoPayload, db: Session = Depends(get_db)):
    s = db.query(SessaoEstudo).filter(SessaoEstudo.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    if payload.duracao_segundos is not None:
        s.duracao_segundos = payload.duracao_segundos
    score_simulado(db, s.id)
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
