from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Materia
from schemas import MateriaCreate, MateriaResponse

router = APIRouter(prefix="/api/materias", tags=["materias"])


@router.get("/", response_model=list[MateriaResponse])
def listar(apenas_ativas: bool = False, db: Session = Depends(get_db)):
    query = db.query(Materia)
    if apenas_ativas:
        query = query.filter(Materia.ativo == True)
    materias = query.order_by(Materia.nome).all()
    return [{
        "id": m.id, "nome": m.nome, "descricao": m.descricao, "ativo": m.ativo,
        "total_assuntos": len(m.assuntos), "created_at": m.created_at, "updated_at": m.updated_at,
    } for m in materias]


@router.get("/{id}", response_model=MateriaResponse)
def obter(id: int, db: Session = Depends(get_db)):
    m = db.query(Materia).filter(Materia.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Matéria não encontrada")
    return {
        "id": m.id, "nome": m.nome, "descricao": m.descricao, "ativo": m.ativo,
        "total_assuntos": len(m.assuntos), "created_at": m.created_at, "updated_at": m.updated_at,
    }


@router.post("/", response_model=MateriaResponse, status_code=201)
def criar(data: MateriaCreate, db: Session = Depends(get_db)):
    if db.query(Materia).filter(Materia.nome == data.nome).first():
        raise HTTPException(status_code=400, detail="Já existe uma matéria com este nome")
    m = Materia(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return {
        "id": m.id, "nome": m.nome, "descricao": m.descricao, "ativo": m.ativo,
        "total_assuntos": 0, "created_at": m.created_at, "updated_at": m.updated_at,
    }


@router.put("/{id}", response_model=MateriaResponse)
def atualizar(id: int, data: MateriaCreate, db: Session = Depends(get_db)):
    m = db.query(Materia).filter(Materia.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Matéria não encontrada")
    m.nome = data.nome
    m.descricao = data.descricao
    m.ativo = data.ativo
    db.commit()
    db.refresh(m)
    return {
        "id": m.id, "nome": m.nome, "descricao": m.descricao, "ativo": m.ativo,
        "total_assuntos": len(m.assuntos), "created_at": m.created_at, "updated_at": m.updated_at,
    }


@router.delete("/{id}", status_code=204)
def excluir(id: int, db: Session = Depends(get_db)):
    m = db.query(Materia).filter(Materia.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Matéria não encontrada")
    db.delete(m)
    db.commit()
