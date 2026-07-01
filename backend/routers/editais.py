from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Edital, EditalMateria, Materia
from readiness import edital_ativo, readiness
from schemas import EditalCreate, EditalMateriaCreate, EditalResponse

router = APIRouter(prefix="/api/editais", tags=["editais"])


def _format_em(em: EditalMateria) -> dict:
    return {
        "id": em.id,
        "materia_id": em.materia_id,
        "materia_nome": em.materia.nome if em.materia else None,
        "peso": em.peso,
    }


def _format(e: Edital) -> dict:
    return {
        "id": e.id,
        "nome": e.nome,
        "banca": e.banca,
        "vagas": e.vagas,
        "data_prova": e.data_prova,
        "materias": [_format_em(em) for em in e.materias],
        "created_at": e.created_at,
    }


@router.get("/", response_model=list[EditalResponse])
def listar(db: Session = Depends(get_db)):
    editais = db.query(Edital).order_by(Edital.created_at.desc()).all()
    return [_format(e) for e in editais]


@router.get("/readiness")
def prontidao_ativo(db: Session = Depends(get_db)):
    """Prontidão do edital ativo (mais recente). Se nenhum edital existir,
    calcula sobre o escopo global (todas as matérias ativas, peso 1)."""
    return readiness(db, edital_ativo(db))


@router.get("/{edital_id}", response_model=EditalResponse)
def obter(edital_id: int, db: Session = Depends(get_db)):
    e = db.query(Edital).filter(Edital.id == edital_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Edital não encontrado")
    return _format(e)


@router.post("/", response_model=EditalResponse, status_code=201)
def criar(data: EditalCreate, db: Session = Depends(get_db)):
    e = Edital(
        nome=data.nome,
        banca=data.banca,
        vagas=data.vagas,
        data_prova=data.data_prova,
    )
    db.add(e)
    db.flush()

    for em in data.materias:
        if not db.query(Materia).filter(Materia.id == em.materia_id).first():
            raise HTTPException(status_code=422, detail=f"Matéria {em.materia_id} não existe")
        db.add(EditalMateria(edital_id=e.id, materia_id=em.materia_id, peso=em.peso))

    db.commit()
    db.refresh(e)
    return _format(e)


@router.put("/{edital_id}", response_model=EditalResponse)
def atualizar(edital_id: int, data: EditalCreate, db: Session = Depends(get_db)):
    e = db.query(Edital).filter(Edital.id == edital_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Edital não encontrado")
    e.nome = data.nome
    e.banca = data.banca
    e.vagas = data.vagas
    e.data_prova = data.data_prova
    db.commit()
    db.refresh(e)
    return _format(e)


@router.delete("/{edital_id}", status_code=204)
def excluir(edital_id: int, db: Session = Depends(get_db)):
    e = db.query(Edital).filter(Edital.id == edital_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Edital não encontrado")
    db.delete(e)
    db.commit()


@router.put("/{edital_id}/materias", response_model=EditalResponse)
def definir_materias(edital_id: int, materias: list[EditalMateriaCreate], db: Session = Depends(get_db)):
    """Substitui todas as matérias (e pesos) do edital."""
    e = db.query(Edital).filter(Edital.id == edital_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Edital não encontrado")

    db.query(EditalMateria).filter(EditalMateria.edital_id == edital_id).delete()

    for em in materias:
        if not db.query(Materia).filter(Materia.id == em.materia_id).first():
            raise HTTPException(status_code=422, detail=f"Matéria {em.materia_id} não existe")
        db.add(EditalMateria(edital_id=edital_id, materia_id=em.materia_id, peso=em.peso))

    db.commit()
    db.refresh(e)
    return _format(e)


@router.get("/{edital_id}/readiness")
def prontidao(edital_id: int, db: Session = Depends(get_db)):
    e = db.query(Edital).filter(Edital.id == edital_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Edital não encontrado")
    return readiness(db, e)
