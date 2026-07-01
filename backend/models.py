from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import enum


class Prioridade(str, enum.Enum):
    baixa = "baixa"
    media = "media"
    alta = "alta"


class Materia(Base):
    __tablename__ = "materias"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(200), nullable=False, unique=True)
    descricao = Column(Text, nullable=True)
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assuntos = relationship("Assunto", back_populates="materia", cascade="all, delete-orphan")
    editais = relationship("EditalMateria", back_populates="materia", cascade="all, delete-orphan")


class Assunto(Base):
    __tablename__ = "assuntos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    materia_id = Column(Integer, ForeignKey("materias.id", ondelete="CASCADE"), nullable=False)
    nome = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    materia = relationship("Materia", back_populates="assuntos")
    topicos = relationship("Topico", back_populates="assunto", cascade="all, delete-orphan")


class Topico(Base):
    __tablename__ = "topicos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    assunto_id = Column(Integer, ForeignKey("assuntos.id", ondelete="CASCADE"), nullable=False)
    nome = Column(String(200), nullable=False)
    prioridade = Column(SAEnum(Prioridade), default=Prioridade.media)
    peso = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    assunto = relationship("Assunto", back_populates="topicos")
    sessoes = relationship("SessaoEstudo", back_populates="topico", cascade="all, delete-orphan")


class PlanoSemanal(Base):
    __tablename__ = "plano_semanal"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dia_semana = Column(Integer, nullable=False)
    materia_id = Column(Integer, ForeignKey("materias.id", ondelete="CASCADE"), nullable=True)
    assunto_id = Column(Integer, ForeignKey("assuntos.id", ondelete="CASCADE"), nullable=True)
    tempo_minutos = Column(Integer, default=60)
    tipo = Column(String(20), default="estudo")  # "estudo" ou "resumo"

    materia = relationship("Materia")
    assunto = relationship("Assunto")


class SessaoEstudo(Base):
    __tablename__ = "sessoes_estudo"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    topico_id = Column(Integer, ForeignKey("topicos.id", ondelete="CASCADE"), nullable=False)
    data = Column(DateTime, nullable=False, default=datetime.utcnow)
    tipo = Column(String(20), default="estudo")
    questoes_feitas = Column(Integer, default=0)
    acertos = Column(Integer, default=0)
    erros = Column(Integer, default=0)
    observacoes = Column(Text, nullable=True)
    resumo_feito = Column(Boolean, default=False)
    duracao_segundos = Column(Integer, nullable=True)

    topico = relationship("Topico", back_populates="sessoes")
    revisoes_geradas = relationship(
        "Revisao",
        back_populates="sessao_origem",
        foreign_keys="Revisao.sessao_origem_id",
    )
    questoes = relationship("Questao", back_populates="sessao", cascade="all, delete-orphan")


class Revisao(Base):
    __tablename__ = "revisoes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    topico_id = Column(Integer, ForeignKey("topicos.id", ondelete="CASCADE"), nullable=False)
    sessao_origem_id = Column(Integer, ForeignKey("sessoes_estudo.id", ondelete="SET NULL"), nullable=True)
    sessao_realizada_id = Column(Integer, ForeignKey("sessoes_estudo.id", ondelete="SET NULL"), nullable=True)
    data_prevista = Column(DateTime, nullable=False)
    status = Column(String(20), default="pendente")
    etapa = Column(String(30), nullable=True)
    motivo = Column(String(200), nullable=True)
    percentual_liquido_origem = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    topico = relationship("Topico")
    sessao_origem = relationship(
        "SessaoEstudo",
        foreign_keys=[sessao_origem_id],
        back_populates="revisoes_geradas",
    )
    sessao_realizada = relationship("SessaoEstudo", foreign_keys=[sessao_realizada_id])


class Edital(Base):
    __tablename__ = "editais"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(200), nullable=False)
    banca = Column(String(100), nullable=True)
    vagas = Column(Integer, nullable=True)
    data_prova = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    materias = relationship("EditalMateria", back_populates="edital", cascade="all, delete-orphan")


class EditalMateria(Base):
    __tablename__ = "edital_materias"
    __table_args__ = (UniqueConstraint("edital_id", "materia_id", name="uq_edital_materia"),)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    edital_id = Column(Integer, ForeignKey("editais.id", ondelete="CASCADE"), nullable=False)
    materia_id = Column(Integer, ForeignKey("materias.id", ondelete="CASCADE"), nullable=False)
    peso = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    edital = relationship("Edital", back_populates="materias")
    materia = relationship("Materia", back_populates="editais")


class Meta(Base):
    __tablename__ = "metas"
    __table_args__ = (UniqueConstraint("edital_id", name="uq_meta_edital"),)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    edital_id = Column(Integer, ForeignKey("editais.id", ondelete="SET NULL"), nullable=True)
    questoes_por_dia = Column(Integer, default=40)
    questoes_por_semana = Column(Integer, default=200)
    minutos_por_dia = Column(Integer, default=180)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    edital = relationship("Edital")


class Questao(Base):
    __tablename__ = "questoes"
    __table_args__ = (UniqueConstraint("sessao_id", "numero", name="uq_questao_sessao_numero"),)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sessao_id = Column(Integer, ForeignKey("sessoes_estudo.id", ondelete="CASCADE"), nullable=False)
    topico_id = Column(Integer, ForeignKey("topicos.id", ondelete="CASCADE"), nullable=False)
    numero = Column(Integer, nullable=True)
    banca = Column(String(100), nullable=True)
    ano = Column(Integer, nullable=True)
    prova_origem = Column(String(200), nullable=True)
    gabarito = Column(String(10), nullable=True)
    resposta = Column(String(10), nullable=True)
    acertou = Column(Boolean, nullable=True)
    observacao = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessao = relationship("SessaoEstudo", back_populates="questoes")
    topico = relationship("Topico")


class Conquista(Base):
    __tablename__ = "conquistas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slug = Column(String(60), nullable=False, unique=True)
    nome = Column(String(120), nullable=False)
    descricao = Column(Text, nullable=True)
    icone = Column(String(40), nullable=False)
    unlocked_at = Column(DateTime, nullable=False, default=datetime.utcnow)
