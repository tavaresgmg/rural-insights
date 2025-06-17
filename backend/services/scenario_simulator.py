import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum


class ScenarioType(Enum):
    EQUIPMENT_PURCHASE = "equipment_purchase"
    HIRING = "hiring"
    INVESTMENT = "investment"
    CUSTOM = "custom"


class PaymentMethod(Enum):
    CASH = "cash"
    FINANCING = "financing"
    CONSORTIUM = "consortium"


class EmploymentType(Enum):
    CLT = "clt"
    DAILY_WORKER = "daily_worker"
    OUTSOURCED = "outsourced"


class FinancialScenarioSimulator:
    """
    Simulador de cenários financeiros rurais com cálculos realistas
    considerando sazonalidade, impostos, depreciação e juros
    """
    
    def __init__(self):
        # Taxas e parâmetros de mercado (2024/2025)
        self.rates = {
            'cdi': 0.105,  # 10.5% ao ano
            'inflation': 0.045,  # 4.5% ao ano
            'rural_financing': 0.08,  # 8% ao ano (Pronaf)
            'commercial_rate': 0.14,  # 14% ao ano
            'depreciation_equipment': 0.10,  # 10% ao ano
            'depreciation_vehicles': 0.20,  # 20% ao ano
        }
        
        # Impostos rurais
        self.taxes = {
            'rural_producer': 0.015,  # 1.5% sobre receita (estimativa)
            'clt_charges': 0.68,  # 68% sobre salário (encargos)
            'itr': 0.002,  # ITR estimado
        }
        
        # Sazonalidade típica rural (multiplicador por mês)
        self.seasonality = {
            1: 0.7,   # Janeiro - pós-safra
            2: 0.8,   # Fevereiro - início plantio
            3: 0.9,   # Março - plantio
            4: 1.0,   # Abril - desenvolvimento
            5: 1.1,   # Maio - tratos culturais
            6: 1.3,   # Junho - colheita
            7: 1.4,   # Julho - pico colheita
            8: 1.2,   # Agosto - comercialização
            9: 0.9,   # Setembro - entressafra
            10: 0.8,  # Outubro - planejamento
            11: 0.7,  # Novembro - preparação
            12: 0.6,  # Dezembro - final ano
        }
        
        # Cenários pré-definidos
        self.predefined_scenarios = {
            'tractor_new': {
                'name': 'Trator Novo (120cv)',
                'cost': 450000,
                'monthly_savings': 8000,
                'useful_life': 10,
                'maintenance_cost': 2500,
                'depreciation_rate': 0.10
            },
            'tractor_used': {
                'name': 'Trator Usado (120cv)',
                'cost': 250000,
                'monthly_savings': 6000,
                'useful_life': 6,
                'maintenance_cost': 4000,
                'depreciation_rate': 0.15
            },
            'irrigation_system': {
                'name': 'Sistema Irrigação (10ha)',
                'cost': 120000,
                'monthly_savings': 3500,
                'useful_life': 15,
                'maintenance_cost': 800,
                'depreciation_rate': 0.067
            },
            'grain_silo': {
                'name': 'Silo Graneleiro (500t)',
                'cost': 180000,
                'monthly_savings': 4200,
                'useful_life': 20,
                'maintenance_cost': 600,
                'depreciation_rate': 0.05
            },
            'worker_clt': {
                'name': 'Funcionário CLT',
                'monthly_cost': 3500,
                'charges_multiplier': 1.68,
                'productivity_gain': 2800,
                'type': 'recurring'
            },
            'worker_daily': {
                'name': 'Diarista',
                'daily_cost': 120,
                'days_per_month': 20,
                'productivity_gain': 2200,
                'type': 'variable'
            }
        }
    
    def simulate_scenario(self, scenario_config: Dict) -> Dict:
        """
        Simula um cenário financeiro completo
        
        Args:
            scenario_config: Configuração do cenário
            
        Returns:
            Resultado completo da simulação
        """
        scenario_type = scenario_config.get('type', ScenarioType.CUSTOM.value)
        
        if scenario_type == ScenarioType.EQUIPMENT_PURCHASE.value:
            return self._simulate_equipment_purchase(scenario_config)
        elif scenario_type == ScenarioType.HIRING.value:
            return self._simulate_hiring(scenario_config)
        elif scenario_type == ScenarioType.INVESTMENT.value:
            return self._simulate_investment(scenario_config)
        else:
            return self._simulate_custom_scenario(scenario_config)
    
    def _simulate_equipment_purchase(self, config: Dict) -> Dict:
        """Simula compra de equipamento com diferentes modalidades"""
        equipment = config.get('equipment', 'tractor_new')
        payment_method = config.get('payment_method', PaymentMethod.CASH.value)
        current_cash_flow = config.get('current_monthly_flow', 15000)
        
        # Dados do equipamento
        equip_data = self.predefined_scenarios.get(equipment, self.predefined_scenarios['tractor_new'])
        
        # Calcula cenários de pagamento
        payment_scenarios = {}
        
        # À vista
        cash_scenario = self._calculate_cash_purchase(equip_data, current_cash_flow)
        payment_scenarios['cash'] = cash_scenario
        
        # Financiado
        financing_scenario = self._calculate_financing(equip_data, current_cash_flow)
        payment_scenarios['financing'] = financing_scenario
        
        # Consórcio
        consortium_scenario = self._calculate_consortium(equip_data, current_cash_flow)
        payment_scenarios['consortium'] = consortium_scenario
        
        # Comparação e recomendação
        recommendation = self._get_payment_recommendation(payment_scenarios)
        
        return {
            'equipment': equip_data,
            'payment_scenarios': payment_scenarios,
            'recommendation': recommendation,
            'timeline': self._generate_timeline(payment_scenarios[recommendation['best_option']]),
            'risk_analysis': self._analyze_risk(payment_scenarios[recommendation['best_option']], current_cash_flow)
        }
    
    def _simulate_hiring(self, config: Dict) -> Dict:
        """Simula contratação de mão de obra"""
        employment_type = config.get('employment_type', EmploymentType.CLT.value)
        current_cash_flow = config.get('current_monthly_flow', 15000)
        positions = config.get('positions', 1)
        
        scenarios = {}
        
        # CLT
        clt_data = self.predefined_scenarios['worker_clt'].copy()
        clt_data['positions'] = positions
        scenarios['clt'] = self._calculate_clt_scenario(clt_data, current_cash_flow)
        
        # Diarista
        daily_data = self.predefined_scenarios['worker_daily'].copy()
        daily_data['positions'] = positions
        scenarios['daily'] = self._calculate_daily_worker_scenario(daily_data, current_cash_flow)
        
        # Terceirizado (estimativa)
        outsourced_cost = clt_data['monthly_cost'] * 1.3 * positions  # 30% mais caro
        scenarios['outsourced'] = self._calculate_outsourced_scenario(
            outsourced_cost, current_cash_flow, positions
        )
        
        recommendation = self._get_hiring_recommendation(scenarios)
        
        return {
            'employment_scenarios': scenarios,
            'recommendation': recommendation,
            'cost_comparison': self._compare_employment_costs(scenarios),
            'timeline': self._generate_hiring_timeline(scenarios[recommendation['best_option']])
        }
    
    def _simulate_investment(self, config: Dict) -> Dict:
        """Simula investimentos em infraestrutura"""
        investment_type = config.get('investment', 'irrigation_system')
        current_cash_flow = config.get('current_monthly_flow', 15000)
        
        investment_data = self.predefined_scenarios.get(
            investment_type, 
            self.predefined_scenarios['irrigation_system']
        )
        
        # Projeção de retorno
        roi_analysis = self._calculate_investment_roi(investment_data, current_cash_flow)
        payback_analysis = self._calculate_payback(investment_data)
        risk_assessment = self._assess_investment_risk(investment_data, current_cash_flow)
        
        return {
            'investment': investment_data,
            'roi_analysis': roi_analysis,
            'payback_analysis': payback_analysis,
            'risk_assessment': risk_assessment,
            'timeline': self._generate_investment_timeline(investment_data),
            'sensitivity_analysis': self._perform_sensitivity_analysis(investment_data)
        }
    
    def _calculate_cash_purchase(self, equipment: Dict, current_flow: float) -> Dict:
        """Calcula cenário de compra à vista"""
        total_cost = equipment['cost']
        monthly_savings = equipment['monthly_savings']
        maintenance = equipment['maintenance_cost']
        
        # Impacto imediato no fluxo de caixa
        immediate_impact = -total_cost
        monthly_net_benefit = monthly_savings - maintenance
        
        # Projeção 12 meses
        monthly_projections = []
        accumulated_flow = current_flow + immediate_impact
        
        for month in range(1, 13):
            seasonal_factor = self.seasonality[month]
            monthly_flow = (current_flow * seasonal_factor) + monthly_net_benefit
            accumulated_flow += monthly_flow
            
            monthly_projections.append({
                'month': month,
                'monthly_flow': monthly_flow,
                'accumulated_flow': accumulated_flow,
                'seasonal_factor': seasonal_factor
            })
        
        # Métricas
        total_savings_year = sum(proj['monthly_flow'] for proj in monthly_projections)
        payback_months = total_cost / monthly_net_benefit if monthly_net_benefit > 0 else float('inf')
        
        return {
            'method': 'cash',
            'total_investment': total_cost,
            'monthly_net_benefit': monthly_net_benefit,
            'immediate_impact': immediate_impact,
            'monthly_projections': monthly_projections,
            'payback_months': payback_months,
            'first_year_savings': total_savings_year,
            'liquidity_impact': 'high'  # Alto impacto na liquidez
        }
    
    def _calculate_financing(self, equipment: Dict, current_flow: float) -> Dict:
        """Calcula cenário de financiamento"""
        total_cost = equipment['cost']
        monthly_savings = equipment['monthly_savings']
        maintenance = equipment['maintenance_cost']
        
        # Parâmetros do financiamento (Pronaf típico)
        down_payment = total_cost * 0.20  # 20% entrada
        financed_amount = total_cost - down_payment
        months = 60  # 5 anos
        monthly_rate = self.rates['rural_financing'] / 12
        
        # Prestação (Price)
        monthly_payment = (financed_amount * monthly_rate * (1 + monthly_rate)**months) / \
                         ((1 + monthly_rate)**months - 1)
        
        monthly_net_benefit = monthly_savings - maintenance - monthly_payment
        
        # Projeção
        monthly_projections = []
        accumulated_flow = current_flow - down_payment
        
        for month in range(1, 13):
            seasonal_factor = self.seasonality[month]
            base_flow = current_flow * seasonal_factor
            monthly_flow = base_flow + monthly_net_benefit
            accumulated_flow += monthly_flow
            
            monthly_projections.append({
                'month': month,
                'monthly_flow': monthly_flow,
                'accumulated_flow': accumulated_flow,
                'seasonal_factor': seasonal_factor,
                'payment': monthly_payment if month <= 12 else 0  # Assume financiamento longo
            })
        
        total_interest = (monthly_payment * months) - financed_amount
        
        return {
            'method': 'financing',
            'total_investment': total_cost,
            'down_payment': down_payment,
            'financed_amount': financed_amount,
            'monthly_payment': monthly_payment,
            'monthly_net_benefit': monthly_net_benefit,
            'monthly_projections': monthly_projections,
            'total_interest': total_interest,
            'financing_months': months,
            'liquidity_impact': 'medium'
        }
    
    def _calculate_consortium(self, equipment: Dict, current_flow: float) -> Dict:
        """Calcula cenário de consórcio"""
        total_cost = equipment['cost']
        monthly_savings = equipment['monthly_savings']
        maintenance = equipment['maintenance_cost']
        
        # Parâmetros típicos de consórcio
        months = 60
        monthly_contribution = total_cost / months
        admin_fee = total_cost * 0.12  # 12% taxa administrativa
        total_paid = total_cost + admin_fee
        monthly_payment = total_paid / months
        
        # Assume contemplação no mês 30 (média)
        contemplation_month = 30
        
        monthly_projections = []
        accumulated_flow = current_flow
        
        for month in range(1, 13):
            seasonal_factor = self.seasonality[month]
            base_flow = current_flow * seasonal_factor
            
            if month < contemplation_month:
                # Antes da contemplação: só paga parcela
                monthly_flow = base_flow - monthly_payment
            else:
                # Após contemplação: recebe benefícios
                monthly_net_benefit = monthly_savings - maintenance - monthly_payment
                monthly_flow = base_flow + monthly_net_benefit
            
            accumulated_flow += monthly_flow
            
            monthly_projections.append({
                'month': month,
                'monthly_flow': monthly_flow,
                'accumulated_flow': accumulated_flow,
                'seasonal_factor': seasonal_factor,
                'payment': monthly_payment,
                'contemplated': month >= contemplation_month
            })
        
        return {
            'method': 'consortium',
            'total_investment': total_cost,
            'total_paid': total_paid,
            'admin_fee': admin_fee,
            'monthly_payment': monthly_payment,
            'contemplation_month': contemplation_month,
            'monthly_projections': monthly_projections,
            'liquidity_impact': 'low'
        }
    
    def _calculate_clt_scenario(self, worker_data: Dict, current_flow: float) -> Dict:
        """Calcula cenário de contratação CLT"""
        base_salary = worker_data['monthly_cost']
        positions = worker_data['positions']
        charges_multiplier = worker_data['charges_multiplier']
        productivity_gain = worker_data['productivity_gain']
        
        total_monthly_cost = base_salary * charges_multiplier * positions
        total_productivity_gain = productivity_gain * positions
        monthly_net_benefit = total_productivity_gain - total_monthly_cost
        
        # Custos adicionais (13º, férias, rescisão)
        annual_extra_costs = base_salary * 2.33 * positions  # 13º + férias + 1/3
        
        monthly_projections = []
        accumulated_flow = current_flow
        
        for month in range(1, 13):
            seasonal_factor = self.seasonality[month]
            base_flow = current_flow * seasonal_factor
            
            # Considera custos extras em dezembro
            extra_cost = annual_extra_costs if month == 12 else 0
            monthly_flow = base_flow + monthly_net_benefit - extra_cost
            accumulated_flow += monthly_flow
            
            monthly_projections.append({
                'month': month,
                'monthly_flow': monthly_flow,
                'accumulated_flow': accumulated_flow,
                'monthly_cost': total_monthly_cost + (extra_cost if month == 12 else 0),
                'productivity_gain': total_productivity_gain
            })
        
        return {
            'employment_type': 'clt',
            'base_salary': base_salary,
            'total_monthly_cost': total_monthly_cost,
            'productivity_gain': total_productivity_gain,
            'monthly_net_benefit': monthly_net_benefit,
            'annual_extra_costs': annual_extra_costs,
            'monthly_projections': monthly_projections,
            'stability': 'high',
            'legal_compliance': 'full'
        }
    
    def _calculate_daily_worker_scenario(self, worker_data: Dict, current_flow: float) -> Dict:
        """Calcula cenário de diarista"""
        daily_cost = worker_data['daily_cost']
        days_per_month = worker_data['days_per_month']
        positions = worker_data['positions']
        productivity_gain = worker_data['productivity_gain']
        
        monthly_cost = daily_cost * days_per_month * positions
        total_productivity_gain = productivity_gain * positions
        monthly_net_benefit = total_productivity_gain - monthly_cost
        
        monthly_projections = []
        accumulated_flow = current_flow
        
        for month in range(1, 13):
            seasonal_factor = self.seasonality[month]
            base_flow = current_flow * seasonal_factor
            
            # Ajusta dias trabalhados pela sazonalidade
            adjusted_days = days_per_month * seasonal_factor
            adjusted_cost = daily_cost * adjusted_days * positions
            adjusted_productivity = total_productivity_gain * seasonal_factor
            
            monthly_flow = base_flow + (adjusted_productivity - adjusted_cost)
            accumulated_flow += monthly_flow
            
            monthly_projections.append({
                'month': month,
                'monthly_flow': monthly_flow,
                'accumulated_flow': accumulated_flow,
                'days_worked': adjusted_days,
                'monthly_cost': adjusted_cost,
                'productivity_gain': adjusted_productivity
            })
        
        return {
            'employment_type': 'daily',
            'daily_cost': daily_cost,
            'average_days_month': days_per_month,
            'monthly_cost': monthly_cost,
            'productivity_gain': total_productivity_gain,
            'monthly_net_benefit': monthly_net_benefit,
            'monthly_projections': monthly_projections,
            'flexibility': 'high',
            'legal_compliance': 'basic'
        }
    
    def _calculate_outsourced_scenario(self, monthly_cost: float, current_flow: float, positions: int) -> Dict:
        """Calcula cenário de terceirização"""
        # Terceirização tem custo maior mas menos responsabilidades
        productivity_gain = 2500 * positions  # Ligeiramente menor que CLT
        monthly_net_benefit = productivity_gain - monthly_cost
        
        monthly_projections = []
        accumulated_flow = current_flow
        
        for month in range(1, 13):
            seasonal_factor = self.seasonality[month]
            base_flow = current_flow * seasonal_factor
            monthly_flow = base_flow + monthly_net_benefit
            accumulated_flow += monthly_flow
            
            monthly_projections.append({
                'month': month,
                'monthly_flow': monthly_flow,
                'accumulated_flow': accumulated_flow,
                'monthly_cost': monthly_cost,
                'productivity_gain': productivity_gain
            })
        
        return {
            'employment_type': 'outsourced',
            'monthly_cost': monthly_cost,
            'productivity_gain': productivity_gain,
            'monthly_net_benefit': monthly_net_benefit,
            'monthly_projections': monthly_projections,
            'legal_responsibility': 'low',
            'management_effort': 'low'
        }
    
    def _calculate_investment_roi(self, investment: Dict, current_flow: float) -> Dict:
        """Calcula ROI do investimento"""
        cost = investment['cost']
        monthly_savings = investment['monthly_savings']
        maintenance = investment['maintenance_cost']
        useful_life = investment['useful_life']
        
        annual_net_benefit = (monthly_savings - maintenance) * 12
        total_benefits = annual_net_benefit * useful_life
        roi = ((total_benefits - cost) / cost) * 100
        
        return {
            'initial_investment': cost,
            'annual_net_benefit': annual_net_benefit,
            'total_benefits': total_benefits,
            'roi_percentage': roi,
            'useful_life_years': useful_life
        }
    
    def _calculate_payback(self, investment: Dict) -> Dict:
        """Calcula período de payback"""
        cost = investment['cost']
        monthly_net = investment['monthly_savings'] - investment['maintenance_cost']
        
        payback_months = cost / monthly_net if monthly_net > 0 else float('inf')
        payback_years = payback_months / 12
        
        return {
            'payback_months': payback_months,
            'payback_years': payback_years,
            'monthly_net_benefit': monthly_net,
            'breakeven_analysis': 'positive' if payback_months < 60 else 'questionable'
        }
    
    def _get_payment_recommendation(self, scenarios: Dict) -> Dict:
        """Determina melhor opção de pagamento"""
        recommendations = []
        
        for method, scenario in scenarios.items():
            score = 0
            
            # Critérios de avaliação
            if scenario['liquidity_impact'] == 'low':
                score += 30
            elif scenario['liquidity_impact'] == 'medium':
                score += 20
            else:
                score += 10
            
            # Benefício líquido mensal
            monthly_benefit = scenario.get('monthly_net_benefit', 0)
            if monthly_benefit > 3000:
                score += 25
            elif monthly_benefit > 1000:
                score += 15
            else:
                score += 5
            
            # Payback
            payback_months = scenario.get('payback_months', float('inf'))
            if payback_months < 24:
                score += 25
            elif payback_months < 48:
                score += 15
            else:
                score += 5
            
            recommendations.append({
                'method': method,
                'score': score,
                'scenario': scenario
            })
        
        best = max(recommendations, key=lambda x: x['score'])
        
        return {
            'best_option': best['method'],
            'score': best['score'],
            'alternatives': [r for r in recommendations if r['method'] != best['method']],
            'reasoning': self._get_recommendation_reasoning(best['method'], scenarios)
        }
    
    def _get_recommendation_reasoning(self, method: str, scenarios: Dict) -> str:
        """Gera explicação da recomendação"""
        scenario = scenarios[method]
        
        if method == 'cash':
            return f"Pagamento à vista oferece maior economia total e payback de {scenario['payback_months']:.1f} meses, apesar do impacto inicial na liquidez."
        elif method == 'financing':
            return f"Financiamento preserva liquidez com prestação de R$ {scenario['monthly_payment']:,.2f} e permite aproveitar a oportunidade imediatamente."
        else:  # consortium
            return f"Consórcio oferece menor impacto no fluxo mensal (R$ {scenario['monthly_payment']:,.2f}) mas requer paciência para contemplação."
    
    def _get_hiring_recommendation(self, scenarios: Dict) -> Dict:
        """Recomendação para contratação"""
        best_option = 'clt'  # Default para estabilidade
        
        clt_benefit = scenarios['clt']['monthly_net_benefit']
        daily_benefit = scenarios['daily']['monthly_net_benefit']
        
        if daily_benefit > clt_benefit * 1.2:  # 20% melhor
            best_option = 'daily'
        
        return {
            'best_option': best_option,
            'reasoning': f"Opção {best_option} oferece melhor relação custo-benefício considerando estabilidade e produtividade."
        }
    
    def _generate_timeline(self, scenario: Dict) -> List[Dict]:
        """Gera timeline de 12 meses"""
        return scenario.get('monthly_projections', [])[:12]
    
    def _generate_hiring_timeline(self, scenario: Dict) -> List[Dict]:
        """Timeline específica para contratação"""
        return scenario.get('monthly_projections', [])[:12]
    
    def _generate_investment_timeline(self, investment: Dict) -> List[Dict]:
        """Timeline para investimento"""
        months = []
        monthly_net = investment['monthly_savings'] - investment['maintenance_cost']
        
        for month in range(1, 13):
            seasonal_factor = self.seasonality[month]
            adjusted_benefit = monthly_net * seasonal_factor
            
            months.append({
                'month': month,
                'benefit': adjusted_benefit,
                'seasonal_factor': seasonal_factor
            })
        
        return months
    
    def _analyze_risk(self, scenario: Dict, current_flow: float) -> Dict:
        """Análise de risco do cenário"""
        risk_level = 'low'
        risk_factors = []
        
        # Analisa impacto na liquidez
        min_flow = min(proj['accumulated_flow'] for proj in scenario['monthly_projections'])
        if min_flow < current_flow * 0.3:  # Menos de 30% do fluxo atual
            risk_level = 'high'
            risk_factors.append('Impacto severo na liquidez')
        elif min_flow < current_flow * 0.6:
            risk_level = 'medium'
            risk_factors.append('Impacto moderado na liquidez')
        
        # Analisa payback
        if 'payback_months' in scenario and scenario['payback_months'] > 48:
            risk_level = 'high' if risk_level != 'high' else risk_level
            risk_factors.append('Payback longo (>4 anos)')
        
        return {
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'min_cash_flow': min_flow,
            'liquidity_cushion': min_flow / current_flow if current_flow > 0 else 0
        }
    
    def _assess_investment_risk(self, investment: Dict, current_flow: float) -> Dict:
        """Avaliação de risco específica para investimentos"""
        roi_analysis = self._calculate_investment_roi(investment, current_flow)
        
        risk_level = 'low'
        if roi_analysis['roi_percentage'] < 10:
            risk_level = 'high'
        elif roi_analysis['roi_percentage'] < 20:
            risk_level = 'medium'
        
        return {
            'risk_level': risk_level,
            'roi_risk': 'low' if roi_analysis['roi_percentage'] > 15 else 'high',
            'market_risk': 'medium',  # Risco de mercado sempre presente no agro
            'technology_risk': 'low'
        }
    
    def _compare_employment_costs(self, scenarios: Dict) -> Dict:
        """Compara custos de diferentes tipos de emprego"""
        comparison = {}
        
        for emp_type, scenario in scenarios.items():
            monthly_cost = scenario.get('monthly_cost', scenario.get('total_monthly_cost', 0))
            annual_cost = monthly_cost * 12
            if emp_type == 'clt' and 'annual_extra_costs' in scenario:
                annual_cost += scenario['annual_extra_costs']
            
            productivity = scenario.get('productivity_gain', 0)
            annual_productivity = productivity * 12
            
            comparison[emp_type] = {
                'annual_cost': annual_cost,
                'annual_productivity': annual_productivity,
                'cost_per_productivity': annual_cost / annual_productivity if annual_productivity > 0 else 0
            }
        
        return comparison
    
    def _perform_sensitivity_analysis(self, investment: Dict) -> Dict:
        """Análise de sensibilidade para investimento"""
        base_roi = self._calculate_investment_roi(investment, 15000)['roi_percentage']
        
        scenarios = {}
        
        # Cenário pessimista (-20% benefícios)
        pessimistic = investment.copy()
        pessimistic['monthly_savings'] *= 0.8
        scenarios['pessimistic'] = self._calculate_investment_roi(pessimistic, 15000)['roi_percentage']
        
        # Cenário otimista (+20% benefícios)
        optimistic = investment.copy()
        optimistic['monthly_savings'] *= 1.2
        scenarios['optimistic'] = self._calculate_investment_roi(optimistic, 15000)['roi_percentage']
        
        return {
            'base_scenario': base_roi,
            'pessimistic_scenario': scenarios['pessimistic'],
            'optimistic_scenario': scenarios['optimistic'],
            'sensitivity_range': scenarios['optimistic'] - scenarios['pessimistic']
        }
    
    def _simulate_custom_scenario(self, config: Dict) -> Dict:
        """Simula cenário customizado pelo usuário"""
        # Implementação básica para cenários personalizados
        return {
            'message': 'Cenário customizado em desenvolvimento',
            'config': config
        }