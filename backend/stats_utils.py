"""Funções compartilhadas de estatística de desempenho.

Centraliza os cálculos que antes viviam dentro de ``routers/desempenho.py`` para
que novos módulos (``readiness``, ``engajamento``) possam reaproveitá-los sem
importar um router. O ``desempenho`` continua usando estas mesmas funções.
"""
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models import Assunto, Materia, SessaoEstudo, Topico


def _parse_date(value: str | None, end: bool = False):
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if len(value) == 10 and end:
        return parsed + timedelta(days=1)
    return parsed


def classify(pct_liquido: float) -> str:
    if pct_liquido >= 85:
        return "Dominado"
    if pct_liquido >= 70:
        return "Bom"
    if pct_liquido >= 50:
        return "Atenção"
    return "Crítico"


def filter_sessoes(sessoes, data_inicio: str | None = None, data_fim: str | None = None, tipos: list[str] | None = None):
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


def stats_from_sessoes(sessoes):
    """Retorna (total, acertos, erros, pct_acerto, pct_liquido)."""
    total = sum(s.questoes_feitas for s in sessoes)
    acertos = sum(s.acertos for s in sessoes)
    erros = sum(s.erros for s in sessoes)
    pct = round((acertos / total * 100) if total > 0 else 0, 1)
    pct_liquido = round(((acertos - erros) / total * 100) if total > 0 else 0, 1)
    return total, acertos, erros, pct, pct_liquido


def topicos_query(db: Session, materia_id: int | None = None, assunto_id: int | None = None):
    query = db.query(Topico)
    if assunto_id:
        query = query.filter(Topico.assunto_id == assunto_id)
    if materia_id:
        query = query.join(Assunto).filter(Assunto.materia_id == materia_id)
    return query


def compute_topic_stats(topicos_query, data_inicio: str | None = None, data_fim: str | None = None, tipos: list[str] | None = None):
    result = []
    for t in topicos_query:
        sessoes = filter_sessoes(t.sessoes, data_inicio, data_fim, tipos)
        total, acertos, erros, pct, pct_liquido = stats_from_sessoes(sessoes)
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


def query_sessoes(db: Session, data_inicio: str | None = None, data_fim: str | None = None, materia_id: int | None = None, tipos: list[str] | None = None):
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


def sessoes_por_materia(materia, data_inicio: str | None = None, data_fim: str | None = None, tipos: list[str] | None = None):
    """Coleta todas as sessões de uma matéria (percorrendo assuntos→tópicos)."""
    sessoes = []
    for a in materia.assuntos:
        for t in a.topicos:
            sessoes.extend(filter_sessoes(t.sessoes, data_inicio, data_fim, tipos))
    return sessoes


def materias_ativas(db: Session, materia_id: int | None = None):
    query = db.query(Materia).filter(Materia.ativo == True)
    if materia_id:
        query = query.filter(Materia.id == materia_id)
    return query.all()
