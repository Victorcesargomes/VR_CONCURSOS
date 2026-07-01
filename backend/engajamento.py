"""Engajamento: streak, meta diária e conquistas.

Predicados das conquistas operam sobre um snapshot (``EngajamentoStats``) — são
puros, determinísticos e fáceis de testar. ``grant_unlocks`` é idempotente (slug
UNIQUE). O hook em ``POST /api/sessoes`` avalia e desbloqueia sem nunca bloquear
a criação da sessão.
"""
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models import Materia, Meta, Revisao, SessaoEstudo, Conquista
from stats_utils import sessoes_por_materia, stats_from_sessoes
from study_rules import percentual_liquido

META_DEFAULTS = {"questoes_por_dia": 40, "questoes_por_semana": 200, "minutos_por_dia": 180}


@dataclass
class EngajamentoStats:
    total_sessoes: int
    total_questoes: int
    distinct_study_days: int
    streak_atual: int
    streak_max: int
    dias_meta_cumprida: int
    revisoes_concluidas: int
    materias_dominadas: int
    melhor_pct_materia: float
    simulados_feitos: int
    melhor_simulado_pct: float


def _streak(days_set: set):
    """Retorna (streak_atual, streak_max). Dá "graça" ao dia de hoje ainda não
    estudado (conta como sequência em andamento a partir de ontem)."""
    today = datetime.utcnow().date()
    cur = today if today in days_set else today - timedelta(days=1)
    streak = 0
    while cur in days_set:
        streak += 1
        cur -= timedelta(days=1)

    max_run = run = 0
    prev = None
    for d in sorted(days_set):
        if prev is not None and (d - prev).days == 1:
            run += 1
        else:
            run = 1
        max_run = max(max_run, run)
        prev = d
    return streak, max(max_run, streak)


def meta_global(db: Session) -> Meta | None:
    return db.query(Meta).filter(Meta.edital_id.is_(None)).first()


def compute_stats(db: Session, meta: Meta | None = None) -> EngajamentoStats:
    sessoes = db.query(SessaoEstudo).all()
    total_questoes = sum(s.questoes_feitas for s in sessoes)

    per_day = {}
    for s in sessoes:
        d = s.data.date() if s.data else None
        if d is None:
            continue
        per_day[d] = per_day.get(d, 0) + (s.questoes_feitas or 0)
    days_set = set(per_day.keys())
    streak_atual, streak_max = _streak(days_set)

    qpd = (meta.questoes_por_dia if meta else META_DEFAULTS["questoes_por_dia"])
    dias_meta_cumprida = sum(1 for q in per_day.values() if q >= qpd)

    revisoes_concluidas = db.query(Revisao).filter(Revisao.status == "concluida").count()

    melhor_pct = 0.0
    dominadas = 0
    for m in db.query(Materia).filter(Materia.ativo == True).all():
        _, _, _, _, pct_liq = stats_from_sessoes(sessoes_por_materia(m))
        if pct_liq > melhor_pct:
            melhor_pct = pct_liq
        if pct_liq >= 85:
            dominadas += 1

    sims = [s for s in sessoes if s.tipo == "simulado"]
    melhor_sim = 0.0
    for s in sims:
        pct = percentual_liquido(s.acertos, s.erros, s.questoes_feitas)
        if pct > melhor_sim:
            melhor_sim = pct

    return EngajamentoStats(
        total_sessoes=len(sessoes),
        total_questoes=total_questoes,
        distinct_study_days=len(days_set),
        streak_atual=streak_atual,
        streak_max=streak_max,
        dias_meta_cumprida=dias_meta_cumprida,
        revisoes_concluidas=revisoes_concluidas,
        materias_dominadas=dominadas,
        melhor_pct_materia=melhor_pct,
        simulados_feitos=len(sims),
        melhor_simulado_pct=melhor_sim,
    )


def meta_diaria_progress(db: Session, meta: Meta | None = None) -> dict:
    qpd = (meta.questoes_por_dia if meta else META_DEFAULTS["questoes_por_dia"])
    now = datetime.utcnow()
    start = datetime(now.year, now.month, now.day)
    end = start + timedelta(days=1)
    feitas = db.query(SessaoEstudo).filter(SessaoEstudo.data >= start, SessaoEstudo.data < end).with_entities(SessaoEstudo.questoes_feitas).all()
    total_hoje = sum(row[0] or 0 for row in feitas)
    pct = round(total_hoje / qpd * 100, 1) if qpd else 0
    return {"hoje_questoes": total_hoje, "meta_questoes": qpd, "pct": pct}


# (slug, nome, descrição, ícone lucide, predicado)
ACHIEVEMENT_RULES = [
    ("primeiro_estudo", "Primeiro Passo", "Registre seu primeiro estudo", "Sparkles", lambda s: s.total_sessoes >= 1),
    ("sequencia_7", "Punho Firme", "Estude 7 dias seguidos", "Flame", lambda s: s.streak_max >= 7),
    ("sequencia_30", "Constância", "Estude 30 dias seguidos", "Flame", lambda s: s.streak_max >= 30),
    ("meta_diaria_5", "Foco Diário", "Bata a meta diária em 5 dias", "Target", lambda s: s.dias_meta_cumprida >= 5),
    ("questoes_100", "Centenário", "Resolva 100 questões", "FileQuestion", lambda s: s.total_questoes >= 100),
    ("questoes_1000", "Maratonista", "Resolva 1000 questões", "Trophy", lambda s: s.total_questoes >= 1000),
    ("liquido_85", "Afinado", "Alcance 85% líquido em uma matéria", "Award", lambda s: s.melhor_pct_materia >= 85),
    ("revisoes_50", "Memória de Aço", "Conclua 50 revisões", "CheckCircle2", lambda s: s.revisoes_concluidas >= 50),
    ("simulado_1", "Prova de Fogo", "Faça seu primeiro simulado", "Timer", lambda s: s.simulados_feitos >= 1),
    ("simulado_80", "Aprovetão", "Tire 80%+ em um simulado", "Star", lambda s: s.melhor_simulado_pct >= 80),
    ("consistencia_30d", "Dedicação", "Estude em 30 dias diferentes", "CalendarDays", lambda s: s.distinct_study_days >= 30),
]

_RULE_BY_SLUG = {r[0]: r for r in ACHIEVEMENT_RULES}


def eval_unlocks(db: Session, stats: EngajamentoStats) -> list[str]:
    already = {c.slug for c in db.query(Conquista).all()}
    return [slug for slug, _, _, _, pred in ACHIEVEMENT_RULES if slug not in already and pred(stats)]


def grant_unlocks(db: Session, slugs: list[str]) -> list[Conquista]:
    now = datetime.utcnow()
    created = []
    for slug in slugs:
        if db.query(Conquista).filter(Conquista.slug == slug).first():
            continue
        _, nome, descricao, icone, _ = _RULE_BY_SLUG[slug]
        c = Conquista(slug=slug, nome=nome, descricao=descricao, icone=icone, unlocked_at=now)
        db.add(c)
        created.append(c)
    return created


def conquista_dict(c: Conquista) -> dict:
    return {"slug": c.slug, "nome": c.nome, "descricao": c.descricao, "icone": c.icone}


def avaliar(db: Session, meta: Meta | None = None) -> list[dict]:
    """Avalia e persiste novas conquistas. Idempotente. Retorna as novas."""
    stats = compute_stats(db, meta)
    novos = grant_unlocks(db, eval_unlocks(db, stats))
    if novos:
        db.commit()
    return [conquista_dict(c) for c in novos]


def todas_conquistas(db: Session) -> dict:
    unlocked_map = {c.slug: c for c in db.query(Conquista).all()}
    unlocked, locked = [], []
    for slug, nome, descricao, icone, _ in ACHIEVEMENT_RULES:
        item = {"slug": slug, "nome": nome, "descricao": descricao, "icone": icone}
        if slug in unlocked_map:
            unlocked.append({**item, "unlocked_at": unlocked_map[slug].unlocked_at})
        else:
            locked.append(item)
    return {"unlocked": unlocked, "locked": locked}
