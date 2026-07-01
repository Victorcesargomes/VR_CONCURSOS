from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from csv_export import to_csv
from database import get_db
from models import Assunto, Materia, SessaoEstudo, Topico
from stats_utils import (
    classify,
    compute_topic_stats,
    filter_sessoes as _filter_sessoes,
    query_sessoes as _query_sessoes,
    sessoes_por_materia,
    stats_from_sessoes as _stats_from_sessoes,
    topicos_query as _topicos_query,
)

router = APIRouter(prefix="/api/desempenho", tags=["desempenho"])


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
        sessoes_m = sessoes_por_materia(m, data_inicio, data_fim, tipos)
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
        sessoes = sessoes_por_materia(m, data_inicio, data_fim, tipos)
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


@router.get("/export.csv")
def exportar_csv(
    materia_id: int = None,
    assunto_id: int = None,
    data_inicio: str = None,
    data_fim: str = None,
    tipos: list[str] | None = Query(None),
    db: Session = Depends(get_db),
):
    stats = compute_topic_stats(_topicos_query(db, materia_id, assunto_id).all(), data_inicio, data_fim, tipos)
    columns = ["materia_nome", "assunto_nome", "topico_nome", "prioridade",
               "total_questoes", "acertos", "erros", "percentual_acerto", "percentual_liquido", "classificacao"]
    return Response(
        content=to_csv(stats, columns),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=desempenho.csv"},
    )
