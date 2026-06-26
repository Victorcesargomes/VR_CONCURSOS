from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Assunto, Materia, SessaoEstudo, Topico

router = APIRouter(prefix="/api/desempenho", tags=["desempenho"])


def _parse_date(value: str | None, end: bool = False):
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if len(value) == 10 and end:
        return parsed + timedelta(days=1)
    return parsed


def _filter_sessoes(sessoes, data_inicio: str | None = None, data_fim: str | None = None, tipos: list[str] | None = None):
    start = _parse_date(data_inicio)
    end = _parse_date(data_fim, end=True)
    tipos_set = set(tipos) if tipos else None
    result = []
    for sessao in sessoes:
        if start and sessao.data < start:
            continue
        if end and sessao.data >= end:
            continue
        if tipos_set and sessao.tipo not in tipos_set:
            continue
        result.append(sessao)
    return result


def classify(pct_liquido: float) -> str:
    if pct_liquido >= 85:
        return "Dominado"
    if pct_liquido >= 70:
        return "Bom"
    if pct_liquido >= 50:
        return "Atenção"
    return "Crítico"


def _stats_from_sessoes(sessoes):
    total = sum(s.questoes_feitas for s in sessoes)
    acertos = sum(s.acertos for s in sessoes)
    erros = sum(s.erros for s in sessoes)
    pct = round((acertos / total * 100) if total > 0 else 0, 1)
    pct_liquido = round(((acertos - erros) / total * 100) if total > 0 else 0, 1)
    return total, acertos, erros, pct, pct_liquido


def _topicos_query(db: Session, materia_id: int | None = None, assunto_id: int | None = None):
    query = db.query(Topico)
    if assunto_id:
        query = query.filter(Topico.assunto_id == assunto_id)
    if materia_id:
        query = query.join(Assunto).filter(Assunto.materia_id == materia_id)
    return query


def compute_topic_stats(topicos_query, data_inicio: str | None = None, data_fim: str | None = None, tipos: list[str] | None = None):
    result = []
    for t in topicos_query:
        sessoes = _filter_sessoes(t.sessoes, data_inicio, data_fim, tipos)
        total, acertos, erros, pct, pct_liquido = _stats_from_sessoes(sessoes)
        result.append({
            "topico_id": t.id,
            "topico_nome": t.nome,
            "assunto_nome": t.assunto.nome,
            "materia_nome": t.assunto.materia.nome,
            "prioridade": t.prioridade.value if t.prioridade else "media",
            "total_questoes": total,
            "acertos": acertos,
            "erros": erros,
            "percentual_acerto": pct,
            "percentual_liquido": pct_liquido,
            "classificacao": classify(pct_liquido),
        })
    result.sort(key=lambda x: x["percentual_liquido"])
    return result


def _query_sessoes(db: Session, data_inicio: str | None = None, data_fim: str | None = None, materia_id: int | None = None, tipos: list[str] | None = None):
    query = db.query(SessaoEstudo)
    start = _parse_date(data_inicio)
    end = _parse_date(data_fim, end=True)
    if start:
        query = query.filter(SessaoEstudo.data >= start)
    if end:
        query = query.filter(SessaoEstudo.data < end)
    if materia_id:
        query = query.join(Topico).join(Assunto).filter(Assunto.materia_id == materia_id)
    if tipos:
        query = query.filter(SessaoEstudo.tipo.in_(tipos))
    return query.all()


@router.get("/dashboard")
def dashboard(
    data_inicio: str = None,
    data_fim: str = None,
    materia_id: int = None,
    tipos: list[str] | None = Query(None),
    db: Session = Depends(get_db),
):
    sessoes = _query_sessoes(db, data_inicio, data_fim, materia_id, tipos)
    total_questoes, total_acertos, total_erros, pct_geral, pct_liquido = _stats_from_sessoes(sessoes)
    total_materias = db.query(Materia).filter(Materia.ativo == True).count()

    stats_topicos = compute_topic_stats(_topicos_query(db, materia_id), data_inicio, data_fim, tipos)
    stats_topicos = [s for s in stats_topicos if s["total_questoes"] > 0]

    hoje = datetime.utcnow()
    semanas = []
    for i in range(7, -1, -1):
        fim = hoje - timedelta(days=i * 7)
        inicio = fim - timedelta(days=6)
        qs = _query_sessoes(db, inicio.strftime("%Y-%m-%d"), fim.strftime("%Y-%m-%d"), materia_id, tipos)
        total_s, acertos_s, _, pct_s, _ = _stats_from_sessoes(qs)
        semanas.append({
            "semana": inicio.strftime("%d/%m"),
            "total": total_s,
            "acertos": acertos_s,
            "percentual": pct_s,
        })

    ranking = []
    materias_q = db.query(Materia).filter(Materia.ativo == True)
    if materia_id:
        materias_q = materias_q.filter(Materia.id == materia_id)
    for m in materias_q.all():
        sessoes_m = []
        for a in m.assuntos:
            for t in a.topicos:
                sessoes_m.extend(_filter_sessoes(t.sessoes, data_inicio, data_fim, tipos))
        total_m, acertos_m, erros_m, pct_m, pct_l_m = _stats_from_sessoes(sessoes_m)
        ranking.append({
            "materia": m.nome,
            "total_questoes": total_m,
            "percentual_acerto": pct_m,
            "percentual_liquido": pct_l_m,
            "classificacao": classify(pct_l_m),
        })
    ranking.sort(key=lambda x: x["percentual_liquido"], reverse=True)

    return {
        "total_questoes": total_questoes,
        "percentual_geral_acertos": pct_geral,
        "percentual_geral_liquido": pct_liquido,
        "total_materias": total_materias,
        "materias_ativas": total_materias,
        "pior_topicos": stats_topicos[:5],
        "evolucao_semanal": semanas,
        "ranking_materias": ranking,
        "sugestoes": [s for s in stats_topicos if s["classificacao"] in ("Crítico", "Atenção")][:10],
    }


@router.get("/materias")
def desempenho_materias(
    data_inicio: str = None,
    data_fim: str = None,
    tipos: list[str] | None = Query(None),
    db: Session = Depends(get_db),
):
    result = []
    for m in db.query(Materia).filter(Materia.ativo == True).all():
        sessoes = []
        for a in m.assuntos:
            for t in a.topicos:
                sessoes.extend(_filter_sessoes(t.sessoes, data_inicio, data_fim, tipos))
        total, acertos, erros, pct, pct_liq = _stats_from_sessoes(sessoes)
        result.append({
            "materia_id": m.id,
            "materia_nome": m.nome,
            "total_questoes": total,
            "acertos": acertos,
            "erros": erros,
            "percentual_acerto": pct,
            "percentual_liquido": pct_liq,
            "classificacao": classify(pct_liq),
        })
    return result


@router.get("/assuntos")
def desempenho_assuntos(
    materia_id: int = None,
    data_inicio: str = None,
    data_fim: str = None,
    tipos: list[str] | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Assunto)
    if materia_id:
        query = query.filter(Assunto.materia_id == materia_id)

    result = []
    for a in query.all():
        sessoes = []
        for t in a.topicos:
            sessoes.extend(_filter_sessoes(t.sessoes, data_inicio, data_fim, tipos))
        total, acertos, erros, pct, pct_liq = _stats_from_sessoes(sessoes)
        result.append({
            "assunto_id": a.id,
            "assunto_nome": a.nome,
            "materia_nome": a.materia.nome,
            "total_questoes": total,
            "acertos": acertos,
            "erros": erros,
            "percentual_acerto": pct,
            "percentual_liquido": pct_liq,
            "classificacao": classify(pct_liq),
        })
    return result


@router.get("/assunto/{assunto_id}")
def desempenho_assunto_detalhe(
    assunto_id: int,
    data_inicio: str = None,
    data_fim: str = None,
    tipos: list[str] | None = Query(None),
    db: Session = Depends(get_db),
):
    a = db.query(Assunto).filter(Assunto.id == assunto_id).first()
    if not a:
        return {"erro": "Assunto nao encontrado"}

    sessoes = []
    for t in a.topicos:
        sessoes.extend(_filter_sessoes(t.sessoes, data_inicio, data_fim, tipos))
    total, acertos, erros, pct, pct_liq = _stats_from_sessoes(sessoes)

    return {
        "assunto_id": a.id,
        "assunto_nome": a.nome,
        "materia_nome": a.materia.nome,
        "total_questoes": total,
        "acertos": acertos,
        "erros": erros,
        "percentual_acerto": pct,
        "percentual_liquido": pct_liq,
        "classificacao": classify(pct_liq),
        "topicos": compute_topic_stats(a.topicos, data_inicio, data_fim, tipos),
    }


@router.get("/topicos")
def desempenho_topicos(
    assunto_id: int = None,
    materia_id: int = None,
    data_inicio: str = None,
    data_fim: str = None,
    tipos: list[str] | None = Query(None),
    db: Session = Depends(get_db),
):
    query = _topicos_query(db, materia_id, assunto_id)
    return compute_topic_stats(query.all(), data_inicio, data_fim, tipos)


@router.get("/topico/{topico_id}/historico")
def historico_topico(
    topico_id: int,
    data_inicio: str = None,
    data_fim: str = None,
    tipos: list[str] | None = Query(None),
    db: Session = Depends(get_db),
):
    t = db.query(Topico).filter(Topico.id == topico_id).first()
    if not t:
        return {"erro": "Topico nao encontrado"}

    sessoes = sorted(_filter_sessoes(t.sessoes, data_inicio, data_fim, tipos), key=lambda s: s.data)
    historico = []
    acumulado = []
    for s in sessoes:
        total = s.questoes_feitas
        pct = round((s.acertos / total * 100) if total > 0 else 0, 1)
        pct_liq = round(((s.acertos - s.erros) / total * 100) if total > 0 else 0, 1)
        acumulado.append(pct_liq)
        media_movel = round(sum(acumulado[-3:]) / min(len(acumulado), 3), 1)
        historico.append({
            "id": s.id,
            "data": s.data.strftime("%Y-%m-%d") if s.data else None,
            "tipo": s.tipo or "estudo",
            "questoes_feitas": total,
            "acertos": s.acertos,
            "erros": s.erros,
            "percentual_acerto": pct,
            "percentual_liquido": pct_liq,
            "media_movel_liquida": media_movel,
            "resumo_feito": s.resumo_feito,
        })

    return {
        "topico_id": t.id,
        "topico_nome": t.nome,
        "assunto_nome": t.assunto.nome,
        "materia_nome": t.assunto.materia.nome,
        "prioridade": t.prioridade.value if t.prioridade else "media",
        "historico": historico,
    }
