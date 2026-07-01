"""Cálculo de prontidão (readiness) para a prova-alvo.

Fórmula (todos os componentes em 0–100):

    prontidao = 0.55 * cobertura_ponderada
              + 0.30 * liquido_ponderado
              + 0.15 * tendencia

- ``cobertura_ponderada``: quanto do edital já foi estudado (tópicos com >=1
  sessão), ponderado pelo peso de cada matéria no edital.
- ``liquido_ponderado``: % líquido ponderado pelo peso, só sobre matérias já
  estudadas (total_questoes > 0).
- ``tendencia``: momentum recente (inclinação do % líquido semanal), centrado
  em 50 quando não há histórico suficiente.
"""
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models import Edital, Materia
from stats_utils import materias_ativas, query_sessoes, sessoes_por_materia, stats_from_sessoes

# Pesos da fórmula
W_COBERTURA = 0.55
W_LIQUIDO = 0.30
W_TENDENCIA = 0.15

META_DEFAULTS = {"questoes_por_dia": 40, "questoes_por_semana": 200, "minutos_por_dia": 180}


def edital_ativo(db: Session) -> Edital | None:
    """Edital mais recente (ou None)."""
    return db.query(Edital).order_by(Edital.created_at.desc(), Edital.id.desc()).first()


def pesos_por_materia(db: Session, edital: Edital | None) -> dict[int, float]:
    """Map materia_id -> peso. Se houver edital com matérias, usa esses pesos;
    caso contrário, todas as matérias ativas com peso 1."""
    if edital and edital.materias:
        return {em.materia_id: (em.peso or 1.0) for em in edital.materias}
    return {m.id: 1.0 for m in materias_ativas(db)}


def dias_para_prova(edital: Edital | None) -> int | None:
    if not edital or not edital.data_prova:
        return None
    hoje = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    prova = edital.data_prova.replace(tzinfo=None) if edital.data_prova.tzinfo else edital.data_prova
    prova = prova.replace(hour=0, minute=0, second=0, microsecond=0)
    delta = (prova - hoje).days
    return delta if delta >= 0 else 0


def tendencia(db: Session) -> float:
    """Momentum do % líquido semanal nos últimos ~4 semanas com dados, em 0–100."""
    hoje = datetime.utcnow()
    pct_por_semana = []
    for i in range(7, -1, -1):
        fim = hoje - timedelta(days=i * 7)
        inicio = fim - timedelta(days=6)
        qs = query_sessoes(db, inicio.strftime("%Y-%m-%d"), fim.strftime("%Y-%m-%d"))
        total, acertos, erros, _, pct_liq = stats_from_sessoes(qs)
        if total > 0:
            pct_por_semana.append(pct_liq)

    ultimas = pct_por_semana[-4:]
    if len(ultimas) < 2:
        return 50.0

    # inclinação simples em pontos percentuais por semana
    slope = (ultimas[-1] - ultimas[0]) / (len(ultimas) - 1)
    slope_clamped = max(-10.0, min(10.0, slope))  # clamp ±10 pp/semana
    return round(50 + 50 * (slope_clamped / 10.0), 1)


def _topicos_info(materia) -> tuple[int, int]:
    """Retorna (total_topicos, topicos_com_sessao) da matéria."""
    total = 0
    com_sessao = 0
    for a in materia.assuntos:
        for t in a.topicos:
            total += 1
            if t.sessoes:
                com_sessao += 1
    return total, com_sessao


def readiness(db: Session, edital: Edital | None = None) -> dict:
    if edital is None:
        edital = edital_ativo(db)

    pesos = pesos_por_materia(db, edital)

    # Materias em escopo (com peso e que possuem ao menos 1 tópico)
    materias = db.query(Materia).filter(Materia.id.in_(list(pesos.keys()))).all() if pesos else []
    materias = [m for m in materias if _topicos_info(m)[0] > 0]

    por_materia = []
    soma_peso_cob = 0.0
    soma_peso_cob_den = 0.0
    soma_peso_liq = 0.0
    soma_peso_liq_den = 0.0

    for m in materias:
        peso = pesos.get(m.id, 1.0)
        total_top, com_sessao = _topicos_info(m)
        cobertura_m = round((com_sessao / total_top * 100) if total_top > 0 else 0, 1)

        sessoes = sessoes_por_materia(m)
        total_q, acertos, erros, pct, pct_liq = stats_from_sessoes(sessoes)
        from stats_utils import classify
        classif = classify(pct_liq)

        por_materia.append({
            "materia_id": m.id,
            "materia_nome": m.nome,
            "peso": round(peso, 2),
            "cobertura": cobertura_m,
            "percentual_liquido": pct_liq,
            "classificacao": classif,
            "total_questoes": total_q,
        })

        # cobertura pondera todas as matérias em escopo
        soma_peso_cob += peso * cobertura_m
        soma_peso_cob_den += peso

        # líquido pondera só matérias já estudadas
        if total_q > 0:
            soma_peso_liq += peso * pct_liq
            soma_peso_liq_den += peso

    cobertura = round(soma_peso_cob / soma_peso_cob_den, 1) if soma_peso_cob_den > 0 else 0.0
    liquido = round(soma_peso_liq / soma_peso_liq_den, 1) if soma_peso_liq_den > 0 else 0.0
    tend = tendencia(db)

    score = round(W_COBERTURA * cobertura + W_LIQUIDO * liquido + W_TENDENCIA * tend, 1)

    por_materia.sort(key=lambda x: x["peso"], reverse=True)

    return {
        "score": score,
        "cobertura": cobertura,
        "liquido": liquido,
        "tendencia": tend,
        "dias_para_prova": dias_para_prova(edital),
        "edital_id": edital.id if edital else None,
        "edital_nome": edital.nome if edital else None,
        "data_prova": edital.data_prova if edital else None,
        "por_materia": por_materia,
    }
