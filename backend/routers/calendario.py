from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Assunto, Materia, PlanoSemanal
from schemas import PlanoSemanalCreate, PlanoSemanalResponse

router = APIRouter(prefix="/api/calendario", tags=["calendario"])

DIAS = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"]


def _payload_validado(data: PlanoSemanalCreate, db: Session):
    payload = data.model_dump()
    if not payload.get("materia_id") and not payload.get("assunto_id"):
        raise HTTPException(status_code=400, detail="Informe uma materia ou assunto")

    if payload.get("assunto_id"):
        assunto = db.query(Assunto).filter(Assunto.id == payload["assunto_id"]).first()
        if not assunto:
            raise HTTPException(status_code=404, detail="Assunto nao encontrado")
        payload["materia_id"] = payload.get("materia_id") or assunto.materia_id
    elif not db.query(Materia).filter(Materia.id == payload["materia_id"]).first():
        raise HTTPException(status_code=404, detail="Materia nao encontrada")

    return payload


def _format(p: PlanoSemanal):
    materia = p.materia or (p.assunto.materia if p.assunto else None)
    return {
        "id": p.id,
        "dia_semana": p.dia_semana,
        "materia_id": p.materia_id or (materia.id if materia else None),
        "assunto_id": p.assunto_id,
        "tempo_minutos": p.tempo_minutos,
        "tipo": p.tipo or "estudo",
        "assunto_nome": p.assunto.nome if p.assunto else None,
        "materia_nome": materia.nome if materia else None,
    }


@router.get("/")
def listar(db: Session = Depends(get_db)):
    planos = db.query(PlanoSemanal).order_by(PlanoSemanal.dia_semana).all()
    return [
        {
            "dia": dia,
            "nome": DIAS[dia],
            "planos": [_format(p) for p in planos if p.dia_semana == dia],
        }
        for dia in range(7)
    ]


@router.post("/", response_model=PlanoSemanalResponse, status_code=201)
def criar(data: PlanoSemanalCreate, db: Session = Depends(get_db)):
    p = PlanoSemanal(**_payload_validado(data, db))
    db.add(p)
    db.commit()
    db.refresh(p)
    return _format(p)


@router.put("/{id}", response_model=PlanoSemanalResponse)
def atualizar(id: int, data: PlanoSemanalCreate, db: Session = Depends(get_db)):
    p = db.query(PlanoSemanal).filter(PlanoSemanal.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plano nao encontrado")

    payload = _payload_validado(data, db)
    p.dia_semana = payload["dia_semana"]
    p.materia_id = payload.get("materia_id")
    p.assunto_id = payload.get("assunto_id")
    p.tempo_minutos = payload["tempo_minutos"]
    p.tipo = payload["tipo"]
    db.commit()
    db.refresh(p)
    return _format(p)


@router.delete("/{id}", status_code=204)
def excluir(id: int, db: Session = Depends(get_db)):
    p = db.query(PlanoSemanal).filter(PlanoSemanal.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plano nao encontrado")
    db.delete(p)
    db.commit()
