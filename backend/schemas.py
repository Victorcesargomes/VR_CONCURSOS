from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MateriaBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    ativo: bool = True


class MateriaCreate(MateriaBase):
    pass


class MateriaResponse(MateriaBase):
    id: int
    total_assuntos: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AssuntoBase(BaseModel):
    materia_id: int
    nome: str


class AssuntoCreate(AssuntoBase):
    pass


class AssuntoResponse(AssuntoBase):
    id: int
    materia_nome: Optional[str] = None
    total_topicos: Optional[int] = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class TopicoBase(BaseModel):
    assunto_id: int
    nome: str
    prioridade: str = "media"
    peso: int = 1


class TopicoCreate(TopicoBase):
    pass


class TopicoResponse(TopicoBase):
    id: int
    assunto_nome: Optional[str] = None
    materia_nome: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PlanoSemanalCreate(BaseModel):
    dia_semana: int
    materia_id: Optional[int] = None
    assunto_id: Optional[int] = None
    tempo_minutos: int = 60
    tipo: str = "estudo"


class PlanoSemanalResponse(PlanoSemanalCreate):
    id: int
    assunto_nome: Optional[str] = None
    materia_nome: Optional[str] = None

    model_config = {"from_attributes": True}


class SessaoEstudoCreate(BaseModel):
    topico_id: int
    data: Optional[datetime] = None
    tipo: str = "estudo"
    questoes_feitas: int = 0
    acertos: int = 0
    erros: int = 0
    observacoes: Optional[str] = None
    resumo_feito: bool = False
    revisao_id: Optional[int] = None


class SessaoEstudoResponse(SessaoEstudoCreate):
    id: int
    topico_nome: Optional[str] = None
    assunto_nome: Optional[str] = None
    materia_nome: Optional[str] = None

    model_config = {"from_attributes": True}


class RevisaoResponse(BaseModel):
    id: int
    topico_id: int
    topico_nome: str
    assunto_nome: str
    materia_nome: str
    data_prevista: datetime
    status: str
    etapa: Optional[str] = None
    motivo: Optional[str] = None
    percentual_liquido_origem: float = 0
    dias_atraso: int = 0
    prioridade: str = "media"
    peso: int = 1

    model_config = {"from_attributes": True}


class RevisaoResumo(BaseModel):
    hoje: int
    atrasadas: int
    proximas: int
    total_pendentes: int


class DesempenhoTopico(BaseModel):
    topico_id: int
    topico_nome: str
    assunto_nome: str
    materia_nome: str
    prioridade: str
    total_questoes: int
    acertos: int
    erros: int
    percentual_acerto: float
    percentual_liquido: float
    classificacao: str


class DesempenhoAssunto(BaseModel):
    assunto_id: int
    assunto_nome: str
    materia_nome: str
    total_questoes: int
    acertos: int
    erros: int
    percentual_acerto: float
    percentual_liquido: float
    classificacao: str
    topicos: list[DesempenhoTopico] = []


class DesempenhoMateria(BaseModel):
    materia_id: int
    materia_nome: str
    total_questoes: int
    acertos: int
    erros: int
    percentual_acerto: float
    percentual_liquido: float
    classificacao: str
    assuntos: list[DesempenhoAssunto] = []


class DashboardResponse(BaseModel):
    total_questoes: int
    percentual_geral_acertos: float
    percentual_geral_liquido: float
    total_materias: int
    pior_topicos: list
    evolucao_semanal: list
    ranking_materias: list
    sugestoes: list
