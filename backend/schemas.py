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


class QuestaoBase(BaseModel):
    sessao_id: Optional[int] = None
    topico_id: Optional[int] = None
    numero: Optional[int] = None
    banca: Optional[str] = None
    ano: Optional[int] = None
    prova_origem: Optional[str] = None
    gabarito: Optional[str] = None
    resposta: Optional[str] = None
    acertou: Optional[bool] = None
    observacao: Optional[str] = None


class QuestaoCreate(QuestaoBase):
    pass


class QuestaoResponse(QuestaoBase):
    id: int
    created_at: datetime
    topico_nome: Optional[str] = None
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
    duracao_segundos: Optional[int] = None
    revisao_id: Optional[int] = None
    questoes: list[QuestaoCreate] = []


class SessaoEstudoResponse(SessaoEstudoCreate):
    id: int
    topico_nome: Optional[str] = None
    assunto_nome: Optional[str] = None
    materia_nome: Optional[str] = None
    total_questoes: int = 0
    novas_conquistas: list = []

    model_config = {"from_attributes": True}


class ConquistaResponse(BaseModel):
    slug: str
    nome: str
    descricao: Optional[str] = None
    icone: str
    unlocked_at: Optional[datetime] = None


class FinalizarSimuladoPayload(BaseModel):
    duracao_segundos: Optional[int] = None


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


# ---------- Edital / Prontidão ----------

class EditalMateriaBase(BaseModel):
    materia_id: int
    peso: float = 1.0


class EditalMateriaCreate(EditalMateriaBase):
    pass


class EditalMateriaResponse(EditalMateriaBase):
    id: int
    materia_nome: Optional[str] = None

    model_config = {"from_attributes": True}


class EditalBase(BaseModel):
    nome: str
    banca: Optional[str] = None
    vagas: Optional[int] = None
    data_prova: Optional[datetime] = None


class EditalCreate(EditalBase):
    materias: list[EditalMateriaCreate] = []


class EditalResponse(EditalBase):
    id: int
    materias: list[EditalMateriaResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class MetaBase(BaseModel):
    questoes_por_dia: int = 40
    questoes_por_semana: int = 200
    minutos_por_dia: int = 180
    edital_id: Optional[int] = None


class MetaResponse(MetaBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ReadinessPorMateria(BaseModel):
    materia_id: int
    materia_nome: str
    peso: float
    cobertura: float
    percentual_liquido: float
    classificacao: str
    total_questoes: int


class ReadinessResponse(BaseModel):
    score: float
    cobertura: float
    liquido: float
    tendencia: float
    dias_para_prova: Optional[int] = None
    edital_id: Optional[int] = None
    edital_nome: Optional[str] = None
    data_prova: Optional[datetime] = None
    por_materia: list[ReadinessPorMateria] = []
