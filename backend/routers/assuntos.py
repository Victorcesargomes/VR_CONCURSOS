from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Assunto, Materia
from schemas import AssuntoCreate, AssuntoResponse

router = APIRouter(prefix="/api/assuntos", tags=["assuntos"])


@router.get("/", response_model=list[AssuntoResponse])
def listar(materia_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Assunto)
    if materia_id:
        query = query.filter(Assunto.materia_id == materia_id)
    assuntos = query.order_by(Assunto.nome).all()
    return [{
        "id": a.id, "materia_id": a.materia_id, "nome": a.nome,
        "materia_nome": a.materia.nome, "total_topicos": len(a.topicos),
        "created_at": a.created_at,
    } for a in assuntos]


@router.get("/{id}", response_model=AssuntoResponse)
def obter(id: int, db: Session = Depends(get_db)):
    a = db.query(Assunto).filter(Assunto.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assunto não encontrado")
    return {
        "id": a.id, "materia_id": a.materia_id, "nome": a.nome,
        "materia_nome": a.materia.nome, "total_topicos": len(a.topicos),
        "created_at": a.created_at,
    }


@router.post("/", response_model=AssuntoResponse, status_code=201)
def criar(data: AssuntoCreate, db: Session = Depends(get_db)):
    if not db.query(Materia).filter(Materia.id == data.materia_id).first():
        raise HTTPException(status_code=404, detail="Matéria não encontrada")
    a = Assunto(**data.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return {
        "id": a.id, "materia_id": a.materia_id, "nome": a.nome,
        "materia_nome": a.materia.nome, "total_topicos": 0,
        "created_at": a.created_at,
    }


@router.put("/{id}", response_model=AssuntoResponse)
def atualizar(id: int, data: AssuntoCreate, db: Session = Depends(get_db)):
    a = db.query(Assunto).filter(Assunto.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assunto não encontrado")
    a.nome = data.nome
    a.materia_id = data.materia_id
    db.commit()
    db.refresh(a)
    return {
        "id": a.id, "materia_id": a.materia_id, "nome": a.nome,
        "materia_nome": a.materia.nome, "total_topicos": len(a.topicos),
        "created_at": a.created_at,
    }


@router.delete("/{id}", status_code=204)
def excluir(id: int, db: Session = Depends(get_db)):
    a = db.query(Assunto).filter(Assunto.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assunto não encontrado")
    db.delete(a)
    db.commit()
