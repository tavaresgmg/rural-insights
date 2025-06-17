from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

from services.ai_analyzer import AIAnalyzer
from services.score_calculator import FinancialHealthScoreCalculator
from services.scenario_simulator import FinancialScenarioSimulator
from schemas.analysis import TopCategory, Alert
from prompts.agricultural_expert import get_contexto_completo
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/context")
async def get_agricultural_context():
    """
    Retorna o contexto agrícola atual para referência
    """
    mes_atual = datetime.now().month
    contexto = get_contexto_completo(mes_atual)
    
    return {
        "mes_atual": mes_atual,
        "epoca_agricola": _get_epoca_nome(mes_atual),
        "alertas_sazonais": contexto["alertas_mes"],
        "culturas_info": contexto["contexto_agricola"]["culturas_principais"],
        "precos_referencia": contexto["contexto_agricola"]["insumos_referencia"]
    }


@router.post("/enrich")
async def enrich_analysis(data: Dict[str, Any]):
    """
    Enriquece uma análise existente com insights de IA
    """
    try:
        analyzer = AIAnalyzer()
        
        # Converte dados para objetos esperados
        top_categories = [
            TopCategory(**cat) for cat in data.get("top_categorias", [])
        ]
        
        existing_alerts = [
            Alert(**alert) for alert in data.get("alertas", [])
        ]
        
        insights = await analyzer.analyze_financial_data(
            top_categories=top_categories,
            total_gasto=data.get("total_gasto", 0),
            num_transacoes=data.get("numero_transacoes", 0),
            periodo=data.get("periodo_analise", {}),
            monthly_evolution=data.get("evolucao_mensal", {}),
            existing_alerts=existing_alerts
        )
        
        return {
            "success": True,
            "insights": insights,
            "enrichment_type": "ai_powered" if not insights.get("_fallback") else "rule_based"
        }
        
    except Exception as e:
        logger.error(f"Erro ao enriquecer análise: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao gerar insights adicionais"
        )


@router.get("/tips/{categoria}")
async def get_category_tips(categoria: str):
    """
    Retorna dicas específicas para uma categoria
    """
    categoria_upper = categoria.upper()
    
    tips = {
        "COMBUSTÍVEL": [
            "Faça manutenção preventiva regularmente para melhorar consumo",
            "Considere biodiesel como alternativa mais barata",
            "Organize rotas para minimizar deslocamentos",
            "Negocie contratos anuais com postos"
        ],
        "MÃO DE OBRA FIXA": [
            "Invista em treinamento para aumentar produtividade",
            "Considere mecanização para tarefas repetitivas",
            "Implemente bonificação por produtividade",
            "Avalie terceirização de atividades não essenciais"
        ],
        "NUTRIÇÃO": [
            "Faça análise bromatológica regular da ração",
            "Ajuste formulação conforme fase do animal",
            "Evite desperdício com cochos adequados",
            "Considere produzir parte da ração na propriedade"
        ],
        "COMPRA DE REPOSIÇÃO": [
            "Mantenha estoque mínimo de peças críticas",
            "Faça compras em conjunto com vizinhos",
            "Cadastre-se em cooperativas para melhores preços",
            "Planeje substituições antes da quebra"
        ],
        "MANUTENÇÃO DE MÁQUINAS": [
            "Siga rigorosamente o plano de manutenção preventiva",
            "Treine operadores para cuidados básicos",
            "Mantenha histórico detalhado de cada equipamento",
            "Considere contratos de manutenção para equipamentos críticos"
        ]
    }
    
    if categoria_upper not in tips:
        return {
            "categoria": categoria,
            "tips": [
                "Monitore gastos mensalmente",
                "Compare preços com outros fornecedores",
                "Busque alternativas mais econômicas",
                "Negocie pagamentos à vista"
            ]
        }
    
    return {
        "categoria": categoria,
        "tips": tips[categoria_upper]
    }


@router.post("/financial-health-score")
async def calculate_financial_health_score(data: Dict[str, Any]):
    """
    Calcula o Score de Saúde Financeira Rural (0-100)
    """
    try:
        calculator = FinancialHealthScoreCalculator()
        score_data = calculator.calculate_score(data)
        
        return {
            "success": True,
            "score_data": score_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Erro ao calcular score de saúde financeira: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao calcular score de saúde financeira"
        )


@router.post("/scenario-simulation")
async def simulate_financial_scenario(scenario_config: Dict[str, Any]):
    """
    Simula cenários financeiros rurais com projeções realistas
    """
    try:
        simulator = FinancialScenarioSimulator()
        simulation_result = simulator.simulate_scenario(scenario_config)
        
        return {
            "success": True,
            "simulation": simulation_result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Erro ao simular cenário financeiro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao simular cenário financeiro"
        )


@router.get("/scenario-templates")
async def get_scenario_templates():
    """
    Retorna templates de cenários pré-definidos
    """
    try:
        simulator = FinancialScenarioSimulator()
        
        return {
            "success": True,
            "templates": {
                "equipment": {
                    "tractor_new": simulator.predefined_scenarios["tractor_new"],
                    "tractor_used": simulator.predefined_scenarios["tractor_used"],
                    "irrigation_system": simulator.predefined_scenarios["irrigation_system"],
                    "grain_silo": simulator.predefined_scenarios["grain_silo"]
                },
                "hiring": {
                    "worker_clt": simulator.predefined_scenarios["worker_clt"],
                    "worker_daily": simulator.predefined_scenarios["worker_daily"]
                },
                "rates": simulator.rates,
                "seasonality": simulator.seasonality
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar templates: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao buscar templates de cenários"
        )


def _get_epoca_nome(mes: int) -> str:
    """
    Retorna nome da época agrícola
    """
    if mes in [10, 11, 12, 1]:
        return "Plantio (safra de verão)"
    elif mes in [2, 3, 4]:
        return "Desenvolvimento/Tratos culturais"
    elif mes in [5, 6, 7]:
        return "Colheita/Entressafra"
    else:
        return "Preparo do solo/Planejamento"