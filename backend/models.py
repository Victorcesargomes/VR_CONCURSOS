from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime, Enum as SAEnum
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

    topico = relationship("Topico", back_populates="sessoes")
    revisoes_geradas = relationship(
        "Revisao",
        back_populates="sessao_origem",
        foreign_keys="Revisao.sessao_origem_id",
    )


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
