from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum


class AlertType(str, Enum):
    URGENT = "urgent"
    WARNING = "warning"
    INFO = "info"


class TopCategory(BaseModel):
    nome: str = Field(..., description="Nome da categoria")
    valor: float = Field(..., description="Valor total gasto")
    percentual: float = Field(..., description="Percentual do total")
    transacoes: int = Field(..., description="Número de transações")
    media_por_transacao: float = Field(..., description="Valor médio por transação")
    variacao_mensal: Optional[float] = Field(None, description="Variação % último mês")


class Alert(BaseModel):
    tipo: AlertType
    categoria: str
    mensagem: str
    impacto_estimado: Optional[float] = Field(None, description="Impacto financeiro estimado")
    acao_sugerida: Optional[str] = Field(None, description="Ação recomendada")


class MonthlyEvolution(BaseModel):
    mes: str
    valor: float
    transacoes: int


class AnalysisResponse(BaseModel):
    total_gasto: float = Field(..., description="Total gasto no período")
    numero_transacoes: int = Field(..., description="Total de transações")
    periodo_analise: Dict[str, str] = Field(..., description="Data inicial e final")
    top_categorias: List[TopCategory] = Field(..., description="Top 5 categorias por valor")
    evolucao_mensal: Dict[str, List[MonthlyEvolution]] = Field(..., description="Evolução mensal por categoria")
    alertas: List[Alert] = Field(..., description="Alertas e insights")
    resumo_executivo: str = Field(..., description="Resumo em texto dos principais pontos")


class UploadResponse(BaseModel):
    success: bool
    message: str
    analysis: Optional[AnalysisResponse] = None
    processing_time: float = Field(..., description="Tempo de processamento em segundos")


class ErrorResponse(BaseModel):
    error: str
    detail: str
    suggestion: Optional[str] = None