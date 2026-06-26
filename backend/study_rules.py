from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models import Revisao, SessaoEstudo


def percentual_acerto(acertos: int, total: int) -> float:
    return round((acertos / total * 100) if total > 0 else 0, 1)


def percentual_liquido(acertos: int, erros: int, total: int) -> float:
    return round(((acertos - erros) / total * 100) if total > 0 else 0, 1)


def classify(pct_liquido: float) -> str:
    if pct_liquido >= 85:
        return "Dominado"
    if pct_liquido >= 70:
        return "Bom"
    if pct_liquido >= 50:
        return "Atencao"
    return "Critico"


def review_plan(pct_liquido: float):
    if pct_liquido >= 85:
        return [(7, "D+7"), (21, "D+21"), (45, "D+45")]
    if pct_liquido >= 70:
        return [(3, "D+3"), (14, "D+14"), (30, "D+30")]
    if pct_liquido >= 50:
        return [(1, "D+1"), (7, "D+7"), (21, "D+21")]
    return [(1, "D+1"), (3, "D+3"), (7, "D+7")]


def schedule_reviews(db: Session, sessao: SessaoEstudo):
    if sessao.questoes_feitas <= 0:
        return []

    pct = percentual_liquido(sessao.acertos, sessao.erros, sessao.questoes_feitas)
    classificacao = classify(pct)
    base_date = sessao.data or datetime.utcnow()
    created = []

    for days, etapa in review_plan(pct):
        target = base_date + timedelta(days=days)
        target_start = datetime(target.year, target.month, target.day)
        target_end = target_start + timedelta(days=1)

        exists = db.query(Revisao).filter(
            Revisao.topico_id == sessao.topico_id,
            Revisao.status == "pendente",
            Revisao.data_prevista >= target_start,
            Revisao.data_prevista < target_end,
        ).first()
        if exists:
            continue

        revisao = Revisao(
            topico_id=sessao.topico_id,
            sessao_origem_id=sessao.id,
            data_prevista=target_start,
            status="pendente",
            etapa=etapa,
            motivo=f"{classificacao}: {pct}% liquido",
            percentual_liquido_origem=pct,
            created_at=datetime.utcnow(),
        )
        db.add(revisao)
        created.append(revisao)

    return created


def complete_review(db: Session, revisao_id: int | None, sessao_id: int):
    if not revisao_id:
        return None

    revisao = db.query(Revisao).filter(Revisao.id == revisao_id).first()
    if not revisao:
        return None

    revisao.status = "concluida"
    revisao.sessao_realizada_id = sessao_id
    revisao.completed_at = datetime.utcnow()
    return revisao


def backfill_reviews(db: Session):
    sessoes = db.query(SessaoEstudo).filter(SessaoEstudo.questoes_feitas > 0).all()
    created_count = 0

    for sessao in sessoes:
        already_backfilled = db.query(Revisao).filter(
            Revisao.sessao_origem_id == sessao.id,
        ).first()
        if already_backfilled:
            continue

        created_count += len(schedule_reviews(db, sessao))

    db.commit()
    return created_count
