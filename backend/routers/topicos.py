from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Topico, Assunto
from schemas import TopicoCreate, TopicoResponse

router = APIRouter(prefix="/api/topicos", tags=["topicos"])


def _format(t):
    return {
        "id": t.id, "assunto_id": t.assunto_id, "nome": t.nome,
        "prioridade": t.prioridade.value, "peso": t.peso,
        "assunto_nome": t.assunto.nome,
        "materia_nome": t.assunto.materia.nome,
        "created_at": t.created_at,
    }


@router.get("/", response_model=list[TopicoResponse])
def listar(assunto_id: int = None, materia_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Topico).join(Assunto)
    if assunto_id:
        query = query.filter(Topico.assunto_id == assunto_id)
    if materia_id:
        query = query.filter(Assunto.materia_id == materia_id)
    return [_format(t) for t in query.order_by(Topico.nome).all()]


@router.get("/{id}", response_model=TopicoResponse)
def obter(id: int, db: Session = Depends(get_db)):
    t = db.query(Topico).filter(Topico.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tópico não encontrado")
    return _format(t)


@router.post("/", response_model=TopicoResponse, status_code=201)
def criar(data: TopicoCreate, db: Session = Depends(get_db)):
    if not db.query(Assunto).filter(Assunto.id == data.assunto_id).first():
        raise HTTPException(status_code=404, detail="Assunto não encontrado")
    t = Topico(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return _format(t)


@router.put("/{id}", response_model=TopicoResponse)
def atualizar(id: int, data: TopicoCreate, db: Session = Depends(get_db)):
    t = db.query(Topico).filter(Topico.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tópico não encontrado")
    t.nome = data.nome
    t.assunto_id = data.assunto_id
    t.prioridade = data.prioridade
    t.peso = data.peso
    db.commit()
    db.refresh(t)
    return _format(t)


@router.delete("/{id}", status_code=204)
def excluir(id: int, db: Session = Depends(get_db)):
    t = db.query(Topico).filter(Topico.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tópico não encontrado")
    db.delete(t)
    db.commit()
