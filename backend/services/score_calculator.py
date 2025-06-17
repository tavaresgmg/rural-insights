import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import math


class FinancialHealthScoreCalculator:
    """
    Calcula o Score de Saúde Financeira Rural (0-100) baseado em métricas específicas do agronegócio.
    
    Componentes:
    - Liquidez (30%): Capacidade de pagamento imediato
    - Endividamento (30%): Nível de comprometimento da receita
    - Eficiência (40%): Retorno sobre investimentos e produtividade
    """
    
    def __init__(self):
        # Benchmarks regionais (valores mock baseados em estudos rurais)
        self.benchmarks = {
            'liquidez': {
                'excelente': 6.0,  # 6+ meses de caixa
                'bom': 3.0,        # 3-6 meses
                'regular': 1.5,    # 1.5-3 meses
                'ruim': 0.5        # < 1.5 meses
            },
            'endividamento': {
                'excelente': 0.2,  # <= 20% da receita
                'bom': 0.4,        # 20-40%
                'regular': 0.6,    # 40-60%
                'ruim': 0.8        # > 60%
            },
            'eficiencia': {
                'excelente': 0.25,  # ROI > 25%
                'bom': 0.15,        # ROI 15-25%
                'regular': 0.05,    # ROI 5-15%
                'ruim': 0.0         # ROI < 5%
            }
        }
        
        # Fatores de ajuste por tipo de cultura (sazonalidade)
        self.culture_factors = {
            'soja': {'peak_months': [2, 3, 4], 'adjustment': 1.1},
            'milho': {'peak_months': [6, 7, 8], 'adjustment': 1.05},
            'cafe': {'peak_months': [5, 6, 7], 'adjustment': 1.15},
            'geral': {'peak_months': [], 'adjustment': 1.0}
        }
    
    def calculate_score(self, financial_data: Dict) -> Dict:
        """
        Calcula o score de saúde financeira completo.
        
        Args:
            financial_data: Dados financeiros processados do CSV
            
        Returns:
            Dict com score total, componentes e recomendações
        """
        # Extrai métricas básicas
        gastos_mensais = self._calculate_monthly_expenses(financial_data)
        receitas_anuais = self._estimate_annual_revenue(financial_data)
        caixa_atual = self._estimate_current_cash(financial_data)
        dividas = self._calculate_debts(financial_data)
        
        # Calcula componentes do score
        liquidez_score = self._calculate_liquidity_score(caixa_atual, gastos_mensais)
        endividamento_score = self._calculate_debt_score(dividas, receitas_anuais)
        eficiencia_score = self._calculate_efficiency_score(financial_data)
        
        # Score final ponderado
        score_total = (
            liquidez_score * 0.30 +
            endividamento_score * 0.30 +
            eficiencia_score * 0.40
        )
        
        # Ajuste sazonal
        culture_type = self._detect_culture_type(financial_data)
        seasonal_adjustment = self._apply_seasonal_adjustment(score_total, culture_type)
        score_final = min(100, max(0, seasonal_adjustment))
        
        # Gera recomendações
        recommendations = self._generate_recommendations(
            liquidez_score, endividamento_score, eficiencia_score, financial_data
        )
        
        return {
            'score_total': round(score_final, 1),
            'nivel': self._get_score_level(score_final),
            'componentes': {
                'liquidez': {
                    'score': round(liquidez_score, 1),
                    'peso': 30,
                    'status': self._get_component_status(liquidez_score),
                    'valor_atual': caixa_atual,
                    'meses_cobertura': round(caixa_atual / max(gastos_mensais, 1), 1)
                },
                'endividamento': {
                    'score': round(endividamento_score, 1),
                    'peso': 30,
                    'status': self._get_component_status(endividamento_score),
                    'percentual_receita': round((dividas / max(receitas_anuais, 1)) * 100, 1),
                    'valor_dividas': dividas
                },
                'eficiencia': {
                    'score': round(eficiencia_score, 1),
                    'peso': 40,
                    'status': self._get_component_status(eficiencia_score),
                    'roi_estimado': self._calculate_roi_percentage(financial_data)
                }
            },
            'benchmark': {
                'posicao_regional': self._get_regional_position(score_final),
                'cultura_detectada': culture_type,
                'ajuste_sazonal': round(seasonal_adjustment - score_total, 1)
            },
            'recomendacoes': recommendations,
            'tendencia': self._calculate_trend(financial_data),
            'proxima_revisao': self._calculate_next_review_date()
        }
    
    def _calculate_monthly_expenses(self, data: Dict) -> float:
        """Calcula gastos mensais médios"""
        try:
            categories = data.get('top_categories', [])
            total_expenses = sum(cat.get('valor', 0) for cat in categories)
            
            # Estima período baseado na variação mensal
            monthly_data = data.get('monthly_evolution', [])
            months_count = len(monthly_data) if monthly_data else 1
            
            return total_expenses / max(months_count, 1)
        except:
            return 1000.0  # Valor padrão para evitar divisão por zero
    
    def _estimate_annual_revenue(self, data: Dict) -> float:
        """Estima receita anual baseada nos gastos (heurística rural)"""
        monthly_expenses = self._calculate_monthly_expenses(data)
        # Produtores rurais típicos: margem 15-25%
        return monthly_expenses * 12 / 0.20  # Assume 20% de margem
    
    def _estimate_current_cash(self, data: Dict) -> float:
        """Estima caixa atual baseado no padrão de gastos"""
        monthly_expenses = self._calculate_monthly_expenses(data)
        
        # Analisa anomalias para detectar meses de maior/menor liquidez
        anomalies = data.get('anomalies', [])
        recent_variations = [a.get('impacto', 0) for a in anomalies[-3:]]
        
        if recent_variations:
            variation_factor = 1 + (sum(recent_variations) / len(recent_variations) / 100)
        else:
            variation_factor = 1.0
        
        # Estima entre 1-4 meses de gastos em caixa (típico rural)
        base_cash = monthly_expenses * 2.5
        return base_cash * variation_factor
    
    def _calculate_debts(self, data: Dict) -> float:
        """Calcula total de dívidas baseado em categorias de financiamento"""
        categories = data.get('top_categories', [])
        debt_keywords = ['financiamento', 'empréstimo', 'credito', 'parcelamento', 'juros']
        
        debt_total = 0
        for category in categories:
            desc = category.get('categoria', '').lower()
            if any(keyword in desc for keyword in debt_keywords):
                debt_total += category.get('valor', 0)
        
        # Se não detectar dívidas explícitas, estima baseado no perfil
        if debt_total == 0:
            monthly_expenses = self._calculate_monthly_expenses(data)
            debt_total = monthly_expenses * 3  # Estima 3 meses de gastos em dívidas
        
        return debt_total
    
    def _calculate_liquidity_score(self, cash: float, monthly_expenses: float) -> float:
        """Score de liquidez baseado em meses de cobertura"""
        coverage_months = cash / max(monthly_expenses, 1)
        
        if coverage_months >= self.benchmarks['liquidez']['excelente']:
            return 100
        elif coverage_months >= self.benchmarks['liquidez']['bom']:
            return 80
        elif coverage_months >= self.benchmarks['liquidez']['regular']:
            return 60
        elif coverage_months >= self.benchmarks['liquidez']['ruim']:
            return 40
        else:
            return max(20, coverage_months * 20)  # Score mínimo proporcional
    
    def _calculate_debt_score(self, debts: float, annual_revenue: float) -> float:
        """Score de endividamento (menor endividamento = maior score)"""
        debt_ratio = debts / max(annual_revenue, 1)
        
        if debt_ratio <= self.benchmarks['endividamento']['excelente']:
            return 100
        elif debt_ratio <= self.benchmarks['endividamento']['bom']:
            return 80
        elif debt_ratio <= self.benchmarks['endividamento']['regular']:
            return 60
        elif debt_ratio <= self.benchmarks['endividamento']['ruim']:
            return 40
        else:
            return max(10, 100 - (debt_ratio * 100))  # Penaliza alto endividamento
    
    def _calculate_efficiency_score(self, data: Dict) -> float:
        """Score de eficiência baseado em ROI e gestão de categorias"""
        categories = data.get('top_categories', [])
        monthly_data = data.get('monthly_evolution', [])
        
        # Analisa eficiência por diversificação de gastos
        diversification_score = min(len(categories), 10) * 5  # Max 50 pontos
        
        # Analisa consistência mensal (menor variação = maior eficiência)
        if len(monthly_data) >= 3:
            values = [month.get('valor', 0) for month in monthly_data]
            cv = np.std(values) / max(np.mean(values), 1)  # Coeficiente de variação
            consistency_score = max(0, 50 - (cv * 100))  # Max 50 pontos
        else:
            consistency_score = 30  # Score neutro
        
        total_efficiency = diversification_score + consistency_score
        return min(100, total_efficiency)
    
    def _calculate_roi_percentage(self, data: Dict) -> float:
        """Calcula ROI estimado baseado nos dados disponíveis"""
        monthly_expenses = self._calculate_monthly_expenses(data)
        annual_revenue = self._estimate_annual_revenue(data)
        annual_expenses = monthly_expenses * 12
        
        profit = annual_revenue - annual_expenses
        roi = (profit / max(annual_expenses, 1)) * 100
        
        return round(roi, 1)
    
    def _detect_culture_type(self, data: Dict) -> str:
        """Detecta tipo de cultura baseado nos gastos"""
        categories = data.get('top_categories', [])
        
        keywords = {
            'soja': ['soja', 'semente', 'plantio'],
            'milho': ['milho', 'ração', 'grão'],
            'cafe': ['cafe', 'café', 'colheita'],
        }
        
        for category in categories:
            desc = category.get('categoria', '').lower()
            for culture, terms in keywords.items():
                if any(term in desc for term in terms):
                    return culture
        
        return 'geral'
    
    def _apply_seasonal_adjustment(self, score: float, culture_type: str) -> float:
        """Aplica ajuste sazonal baseado na época do ano"""
        current_month = datetime.now().month
        culture_info = self.culture_factors.get(culture_type, self.culture_factors['geral'])
        
        if current_month in culture_info['peak_months']:
            return score * culture_info['adjustment']
        
        return score
    
    def _get_score_level(self, score: float) -> str:
        """Converte score numérico em nível descritivo"""
        if score >= 80:
            return 'Excelente'
        elif score >= 60:
            return 'Bom'
        elif score >= 40:
            return 'Regular'
        else:
            return 'Precisa Atenção'
    
    def _get_component_status(self, score: float) -> str:
        """Status do componente baseado no score"""
        if score >= 75:
            return 'Forte'
        elif score >= 50:
            return 'Adequado'
        elif score >= 30:
            return 'Atenção'
        else:
            return 'Crítico'
    
    def _get_regional_position(self, score: float) -> str:
        """Posição em relação aos benchmarks regionais"""
        if score >= 75:
            return 'Top 25% da região'
        elif score >= 50:
            return 'Acima da média regional'
        elif score >= 30:
            return 'Próximo à média regional'
        else:
            return 'Abaixo da média regional'
    
    def _generate_recommendations(self, liquidez: float, endividamento: float, 
                                eficiencia: float, data: Dict) -> List[Dict]:
        """Gera recomendações específicas baseadas nos scores"""
        recommendations = []
        
        # Recomendações de liquidez
        if liquidez < 50:
            recommendations.append({
                'categoria': 'Liquidez',
                'prioridade': 'alta',
                'acao': 'Criar reserva de emergência equivalente a 3 meses de gastos',
                'impacto_score': '+15 pontos',
                'prazo': '3-6 meses'
            })
        
        # Recomendações de endividamento
        if endividamento < 50:
            recommendations.append({
                'categoria': 'Endividamento',
                'prioridade': 'alta',
                'acao': 'Renegociar dívidas e reduzir comprometimento da receita para menos de 40%',
                'impacto_score': '+20 pontos',
                'prazo': '6-12 meses'
            })
        
        # Recomendações de eficiência
        if eficiencia < 60:
            recommendations.append({
                'categoria': 'Eficiência',
                'prioridade': 'media',
                'acao': 'Diversificar investimentos e melhorar planejamento de safras',
                'impacto_score': '+10 pontos',
                'prazo': '1-2 safras'
            })
        
        # Recomendação sempre presente
        recommendations.append({
            'categoria': 'Gestão',
            'prioridade': 'baixa',
            'acao': 'Manter controle financeiro detalhado e revisar score mensalmente',
            'impacto_score': '+5 pontos',
            'prazo': 'Contínuo'
        })
        
        return recommendations
    
    def _calculate_trend(self, data: Dict) -> Dict:
        """Calcula tendência baseada nos dados históricos"""
        monthly_data = data.get('monthly_evolution', [])
        
        if len(monthly_data) < 3:
            return {'direcao': 'estavel', 'variacao': 0}
        
        # Analisa últimos 3 meses
        recent_values = [month.get('valor', 0) for month in monthly_data[-3:]]
        
        if len(recent_values) >= 2:
            trend = (recent_values[-1] - recent_values[0]) / max(recent_values[0], 1) * 100
            
            if trend > 10:
                return {'direcao': 'melhorando', 'variacao': round(trend, 1)}
            elif trend < -10:
                return {'direcao': 'piorando', 'variacao': round(trend, 1)}
            else:
                return {'direcao': 'estavel', 'variacao': round(trend, 1)}
        
        return {'direcao': 'estavel', 'variacao': 0}
    
    def _calculate_next_review_date(self) -> str:
        """Calcula próxima data de revisão recomendada"""
        next_review = datetime.now() + timedelta(days=30)
        return next_review.strftime('%d/%m/%Y')