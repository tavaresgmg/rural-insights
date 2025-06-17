import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import chardet
from io import StringIO
import logging
import asyncio

from schemas.analysis import (
    TopCategory, Alert, AlertType, MonthlyEvolution, 
    AnalysisResponse
)
from services.ai_analyzer import AIAnalyzer

logger = logging.getLogger(__name__)


class CSVProcessor:
    def __init__(self):
        self.encoding_options = ['utf-8', 'latin1', 'iso-8859-1', 'cp1252']
        self.ai_analyzer = AIAnalyzer()
        
    def detect_encoding(self, file_content: bytes) -> str:
        """Detecta o encoding do arquivo CSV"""
        try:
            # Tenta detectar com chardet
            result = chardet.detect(file_content[:10000])  # Analisa primeiros 10KB
            if result['confidence'] > 0.7:
                return result['encoding']
        except Exception as e:
            logger.warning(f"Erro ao detectar encoding com chardet: {e}")
        
        # Fallback: tenta cada encoding
        for encoding in self.encoding_options:
            try:
                file_content.decode(encoding)
                return encoding
            except UnicodeDecodeError:
                continue
                
        return 'latin1'  # Default seguro
    
    async def process_csv(self, file_content: bytes) -> AnalysisResponse:
        """Processa o arquivo CSV e retorna análise completa"""
        # Detecta encoding
        encoding = self.detect_encoding(file_content)
        logger.info(f"Encoding detectado: {encoding}")
        
        # Lê o CSV
        try:
            csv_string = file_content.decode(encoding)
            df = pd.read_csv(StringIO(csv_string), delimiter=';')
        except Exception as e:
            logger.error(f"Erro ao ler CSV: {e}")
            raise ValueError(f"Erro ao processar arquivo: {str(e)}")
        
        # Limpa e prepara dados
        df = self._prepare_dataframe(df)
        
        # Filtra apenas saídas realizadas
        df_saidas = df[
            (df['operacao'] == 'SAÍDA') & 
            (df['realizado'] == 'SIM')
        ].copy()
        
        if df_saidas.empty:
            raise ValueError("Nenhuma transação de saída encontrada no arquivo")
        
        # Análises
        total_gasto = df_saidas['valor'].sum()
        num_transacoes = len(df_saidas)
        periodo = self._get_periodo(df_saidas)
        
        # Top categorias
        top_categorias = self._calculate_top_categories(df_saidas, total_gasto)
        
        # Evolução mensal
        evolucao_mensal = self._calculate_monthly_evolution(df_saidas)
        
        # Detecção de anomalias e alertas
        alertas = self._generate_alerts(df_saidas, top_categorias, evolucao_mensal)
        
        # Resumo executivo básico
        resumo = self._generate_executive_summary(
            total_gasto, num_transacoes, top_categorias, alertas
        )
        
        # Enriquecer com insights de IA
        try:
            logger.info("Tentando obter insights de IA...")
            ai_insights = await self.ai_analyzer.analyze_financial_data(
                top_categories=top_categorias,
                total_gasto=total_gasto,
                num_transacoes=num_transacoes,
                periodo=periodo,
                monthly_evolution=evolucao_mensal,
                existing_alerts=alertas
            )
            
            # Adicionar insights de IA aos alertas existentes
            if ai_insights and "insights_principais" in ai_insights:
                for insight in ai_insights["insights_principais"][:3]:
                    alertas.append(Alert(
                        tipo=AlertType.INFO,
                        categoria=insight.get("categoria", "Geral"),
                        mensagem=insight.get("mensagem", ""),
                        impacto_estimado=insight.get("valor_impacto"),
                        acao_sugerida=insight.get("acao_recomendada")
                    ))
                
                # Adiciona menção sobre IA no resumo
                if not ai_insights.get("_fallback"):
                    resumo += " Análise enriquecida com inteligência artificial."
                    
        except Exception as e:
            logger.error(f"Erro ao obter insights de IA: {e}")
            # Continua sem os insights de IA
        
        return AnalysisResponse(
            total_gasto=total_gasto,
            numero_transacoes=num_transacoes,
            periodo_analise=periodo,
            top_categorias=top_categorias,
            evolucao_mensal=evolucao_mensal,
            alertas=alertas,
            resumo_executivo=resumo
        )
    
    def _prepare_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepara e limpa o dataframe"""
        # Converte colunas
        df['valor'] = pd.to_numeric(df['valor'], errors='coerce').abs()
        df['data'] = pd.to_datetime(df['data'], format='%d/%m/%Y', errors='coerce')
        
        # Remove valores nulos
        df = df.dropna(subset=['valor', 'data', 'descricao'])
        
        # Normaliza strings
        string_columns = ['descricao', 'operacao', 'realizado']
        for col in string_columns:
            if col in df.columns:
                df[col] = df[col].str.strip().str.upper()
        
        return df
    
    def _get_periodo(self, df: pd.DataFrame) -> Dict[str, str]:
        """Retorna período de análise"""
        return {
            'inicio': df['data'].min().strftime('%d/%m/%Y'),
            'fim': df['data'].max().strftime('%d/%m/%Y')
        }
    
    def _calculate_top_categories(
        self, df: pd.DataFrame, total_gasto: float
    ) -> List[TopCategory]:
        """Calcula top 5 categorias por valor"""
        # Agrupa por categoria
        categoria_stats = df.groupby('descricao').agg({
            'valor': ['sum', 'count', 'mean']
        }).round(2)
        
        # Flatten column names
        categoria_stats.columns = ['total', 'count', 'mean']
        categoria_stats = categoria_stats.sort_values('total', ascending=False).head(5)
        
        # Calcula variação mensal para cada categoria
        top_categories = []
        for categoria, stats in categoria_stats.iterrows():
            # Calcula variação mensal
            variacao = self._calculate_monthly_variation(df, categoria)
            
            top_categories.append(TopCategory(
                nome=categoria,
                valor=float(stats['total']),
                percentual=round(float(stats['total']) / total_gasto * 100, 2),
                transacoes=int(stats['count']),
                media_por_transacao=float(stats['mean']),
                variacao_mensal=variacao
            ))
        
        return top_categories
    
    def _calculate_monthly_variation(
        self, df: pd.DataFrame, categoria: str
    ) -> Optional[float]:
        """Calcula variação percentual do último mês"""
        df_cat = df[df['descricao'] == categoria].copy()
        df_cat['mes'] = df_cat['data'].dt.to_period('M')
        
        monthly = df_cat.groupby('mes')['valor'].sum()
        
        if len(monthly) < 2:
            return None
        
        ultimo_mes = monthly.iloc[-1]
        penultimo_mes = monthly.iloc[-2]
        
        if penultimo_mes == 0:
            return None
            
        variacao = ((ultimo_mes - penultimo_mes) / penultimo_mes) * 100
        return round(variacao, 2)
    
    def _calculate_monthly_evolution(
        self, df: pd.DataFrame
    ) -> Dict[str, List[MonthlyEvolution]]:
        """Calcula evolução mensal das principais categorias"""
        # Pega top 5 categorias
        top_cats = df.groupby('descricao')['valor'].sum().nlargest(5).index
        
        evolucao = {}
        for categoria in top_cats:
            df_cat = df[df['descricao'] == categoria].copy()
            df_cat['mes'] = df_cat['data'].dt.to_period('M')
            
            monthly_data = df_cat.groupby('mes').agg({
                'valor': 'sum',
                'data': 'count'
            }).reset_index()
            
            evolucao[categoria] = [
                MonthlyEvolution(
                    mes=str(row['mes']),
                    valor=float(row['valor']),
                    transacoes=int(row['data'])
                )
                for _, row in monthly_data.iterrows()
            ]
        
        return evolucao
    
    def _generate_alerts(
        self, df: pd.DataFrame, 
        top_categories: List[TopCategory],
        evolucao_mensal: Dict[str, List[MonthlyEvolution]]
    ) -> List[Alert]:
        """Gera alertas baseados em anomalias e padrões"""
        alerts = []
        
        # Alerta para variações mensais altas
        for cat in top_categories:
            if cat.variacao_mensal and cat.variacao_mensal > 30:
                alerts.append(Alert(
                    tipo=AlertType.URGENT,
                    categoria=cat.nome,
                    mensagem=f"{cat.nome} aumentou {cat.variacao_mensal}% no último mês",
                    impacto_estimado=cat.valor * (cat.variacao_mensal / 100),
                    acao_sugerida="Revisar fornecedores e buscar alternativas mais econômicas"
                ))
        
        # Alerta para categorias com alto percentual do total
        for cat in top_categories:
            if cat.percentual > 25:
                alerts.append(Alert(
                    tipo=AlertType.WARNING,
                    categoria=cat.nome,
                    mensagem=f"{cat.nome} representa {cat.percentual}% dos gastos totais",
                    impacto_estimado=cat.valor * 0.1,  # Potencial economia de 10%
                    acao_sugerida="Considerar estratégias de redução ou negociação em volume"
                ))
        
        # Detecção de outliers usando IQR
        for categoria in df['descricao'].unique():
            df_cat = df[df['descricao'] == categoria]
            if len(df_cat) >= 4:  # Precisa de pelo menos 4 transações
                Q1 = df_cat['valor'].quantile(0.25)
                Q3 = df_cat['valor'].quantile(0.75)
                IQR = Q3 - Q1
                upper_bound = Q3 + 1.5 * IQR
                
                outliers = df_cat[df_cat['valor'] > upper_bound]
                if not outliers.empty:
                    alerts.append(Alert(
                        tipo=AlertType.INFO,
                        categoria=categoria,
                        mensagem=f"Detectadas {len(outliers)} transações atípicas em {categoria}",
                        impacto_estimado=float(outliers['valor'].sum() - outliers['valor'].mean() * len(outliers)),
                        acao_sugerida="Verificar se foram compras emergenciais ou erros de lançamento"
                    ))
        
        # Limita a 10 alertas mais relevantes
        alerts = sorted(alerts, key=lambda x: x.impacto_estimado or 0, reverse=True)[:10]
        
        return alerts
    
    def _generate_executive_summary(
        self, total_gasto: float, num_transacoes: int,
        top_categories: List[TopCategory], alerts: List[Alert]
    ) -> str:
        """Gera resumo executivo em português"""
        top_cat = top_categories[0] if top_categories else None
        
        summary = f"No período analisado, foram registradas {num_transacoes} transações "
        summary += f"totalizando R$ {total_gasto:,.2f} em gastos. "
        
        if top_cat:
            summary += f"A categoria '{top_cat.nome}' foi a maior despesa, "
            summary += f"representando {top_cat.percentual}% do total. "
        
        urgent_alerts = [a for a in alerts if a.tipo == AlertType.URGENT]
        if urgent_alerts:
            summary += f"Foram identificados {len(urgent_alerts)} alertas urgentes "
            summary += "que requerem atenção imediata. "
        
        potential_savings = sum(a.impacto_estimado or 0 for a in alerts)
        if potential_savings > 0:
            summary += f"As oportunidades de economia identificadas podem gerar "
            summary += f"uma redução de até R$ {potential_savings:,.2f} nos gastos."
        
        return summary