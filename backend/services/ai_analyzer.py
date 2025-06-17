import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
from openai import AsyncOpenAI
from pydantic import ValidationError

from schemas.analysis import TopCategory, Alert, AlertType
from core.config import settings

logger = logging.getLogger(__name__)


class AIAnalyzer:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.max_retries = 3
        self.timeout = 30  # seconds
        
    async def analyze_financial_data(
        self,
        top_categories: List[TopCategory],
        total_gasto: float,
        num_transacoes: int,
        periodo: Dict[str, str],
        monthly_evolution: Dict[str, List[Dict[str, Any]]],
        existing_alerts: List[Alert]
    ) -> Dict[str, Any]:
        """
        Analisa dados financeiros usando GPT-4 com contexto agrícola
        """
        # Prepara contexto
        context = self._prepare_context(
            top_categories, total_gasto, num_transacoes, 
            periodo, monthly_evolution, existing_alerts
        )
        
        # Gera insights com retry
        for attempt in range(self.max_retries):
            try:
                insights = await self._generate_insights(context)
                return insights
            except Exception as e:
                logger.warning(f"Tentativa {attempt + 1} falhou: {e}")
                if attempt == self.max_retries - 1:
                    logger.error("Todas as tentativas falharam, retornando fallback")
                    return self._get_fallback_insights(top_categories, existing_alerts)
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        return self._get_fallback_insights(top_categories, existing_alerts)
    
    def _prepare_context(
        self,
        top_categories: List[TopCategory],
        total_gasto: float,
        num_transacoes: int,
        periodo: Dict[str, str],
        monthly_evolution: Dict[str, List[Dict[str, Any]]],
        existing_alerts: List[Alert]
    ) -> Dict[str, Any]:
        """
        Prepara contexto estruturado para o GPT-4
        """
        # Calcula médias e tendências
        context = {
            "resumo_financeiro": {
                "total_gasto": total_gasto,
                "numero_transacoes": num_transacoes,
                "media_por_transacao": total_gasto / num_transacoes if num_transacoes > 0 else 0,
                "periodo": periodo
            },
            "top_categorias": [
                {
                    "nome": cat.nome,
                    "valor": cat.valor,
                    "percentual": cat.percentual,
                    "variacao_mensal": cat.variacao_mensal,
                    "transacoes": cat.transacoes,
                    "media": cat.media_por_transacao
                }
                for cat in top_categories
            ],
            "alertas_detectados": [
                {
                    "tipo": alert.tipo,
                    "categoria": alert.categoria,
                    "mensagem": alert.mensagem
                }
                for alert in existing_alerts[:5]  # Limita a 5 alertas
            ],
            "metadata": {
                "mes_atual": datetime.now().strftime("%B"),
                "epoca_ano": self._get_epoca_agricola(),
                "regiao": "Brasil"  # Poderia ser parametrizado
            }
        }
        
        return context
    
    async def _generate_insights(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gera insights usando GPT-4
        """
        system_prompt = self._get_system_prompt()
        user_prompt = self._get_user_prompt(context)
        
        try:
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=2000,
                    response_format={"type": "json_object"}
                ),
                timeout=self.timeout
            )
            
            # Parse response
            content = response.choices[0].message.content
            insights = json.loads(content)
            
            # Valida estrutura
            return self._validate_insights(insights)
            
        except asyncio.TimeoutError:
            logger.error("Timeout ao chamar OpenAI API")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Erro ao decodificar JSON da resposta: {e}")
            raise
        except Exception as e:
            logger.error(f"Erro ao gerar insights: {e}")
            raise
    
    def _get_system_prompt(self) -> str:
        """
        Retorna o prompt do sistema especializado em agricultura
        """
        return """Você é um consultor financeiro agrícola sênior com 20 anos de experiência 
trabalhando com pequenos e médios produtores rurais brasileiros. Você conhece profundamente:

- Ciclos de produção agrícola e pecuária
- Sazonalidade de custos e receitas rurais
- Preços médios de insumos por região
- Melhores práticas de gestão financeira rural
- Oportunidades de economia e otimização

Sua missão é analisar dados financeiros e fornecer insights ESPECÍFICOS e ACIONÁVEIS 
que gerem economia real. Sempre:

1. Use valores monetários específicos (R$)
2. Sugira ações práticas e imediatas
3. Considere o contexto sazonal agrícola
4. Compare com benchmarks do setor
5. Fale em linguagem simples e direta

Responda SEMPRE em formato JSON estruturado."""
    
    def _get_user_prompt(self, context: Dict[str, Any]) -> str:
        """
        Monta prompt do usuário com os dados
        """
        return f"""Analise os seguintes dados financeiros rurais e gere insights valiosos:

DADOS FINANCEIROS:
{json.dumps(context, ensure_ascii=False, indent=2)}

Gere uma análise no seguinte formato JSON:
{{
    "insights_principais": [
        {{
            "categoria": "nome da categoria",
            "tipo": "economia|alerta|oportunidade",
            "mensagem": "insight específico e claro",
            "valor_impacto": número em reais,
            "acao_recomendada": "ação prática e específica",
            "prazo_sugerido": "imediato|30 dias|90 dias"
        }}
    ],
    "analise_categorias": [
        {{
            "categoria": "nome",
            "status": "normal|atencao|critico",
            "analise": "análise específica desta categoria",
            "benchmark": "comparação com média do setor",
            "sugestao": "como otimizar esta categoria"
        }}
    ],
    "oportunidades_economia": [
        {{
            "descricao": "oportunidade específica",
            "economia_estimada": número em reais,
            "como_implementar": "passos práticos",
            "complexidade": "facil|media|complexa"
        }}
    ],
    "recomendacoes_sazonais": [
        {{
            "recomendacao": "ação baseada na época do ano",
            "justificativa": "por que fazer isso agora",
            "impacto_esperado": "resultado esperado"
        }}
    ],
    "score_insights": {{
        "relevancia": 1-10,
        "especificidade": 1-10,
        "acionabilidade": 1-10
    }}
}}"""
    
    def _validate_insights(self, insights: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida e limpa os insights retornados
        """
        # Garante que todas as chaves esperadas existem
        required_keys = [
            "insights_principais",
            "analise_categorias", 
            "oportunidades_economia",
            "recomendacoes_sazonais"
        ]
        
        for key in required_keys:
            if key not in insights:
                insights[key] = []
        
        # Limita quantidade de items
        insights["insights_principais"] = insights["insights_principais"][:5]
        insights["analise_categorias"] = insights["analise_categorias"][:5]
        insights["oportunidades_economia"] = insights["oportunidades_economia"][:3]
        insights["recomendacoes_sazonais"] = insights["recomendacoes_sazonais"][:3]
        
        return insights
    
    def _get_epoca_agricola(self) -> str:
        """
        Retorna a época agrícola atual
        """
        month = datetime.now().month
        
        if month in [10, 11, 12, 1]:
            return "Plantio (safra de verão)"
        elif month in [2, 3, 4]:
            return "Desenvolvimento/Tratos culturais"
        elif month in [5, 6, 7]:
            return "Colheita/Entressafra"
        else:
            return "Preparo do solo/Planejamento"
    
    def _get_fallback_insights(
        self, 
        top_categories: List[TopCategory],
        existing_alerts: List[Alert]
    ) -> Dict[str, Any]:
        """
        Retorna insights básicos caso a API falhe
        """
        insights_principais = []
        
        # Gera insights baseados nos dados locais
        for i, cat in enumerate(top_categories[:3]):
            if cat.variacao_mensal and cat.variacao_mensal > 20:
                insights_principais.append({
                    "categoria": cat.nome,
                    "tipo": "alerta",
                    "mensagem": f"{cat.nome} aumentou {cat.variacao_mensal}% no último mês",
                    "valor_impacto": cat.valor * 0.1,  # 10% de economia potencial
                    "acao_recomendada": "Revisar fornecedores e negociar preços",
                    "prazo_sugerido": "imediato"
                })
            elif cat.percentual > 30:
                insights_principais.append({
                    "categoria": cat.nome,
                    "tipo": "economia",
                    "mensagem": f"{cat.nome} representa {cat.percentual}% dos gastos totais",
                    "valor_impacto": cat.valor * 0.15,
                    "acao_recomendada": "Buscar alternativas ou compras em conjunto",
                    "prazo_sugerido": "30 dias"
                })
        
        return {
            "insights_principais": insights_principais,
            "analise_categorias": [
                {
                    "categoria": cat.nome,
                    "status": "atencao" if cat.percentual > 25 else "normal",
                    "analise": f"Categoria com {cat.transacoes} transações",
                    "benchmark": "Análise de benchmark indisponível",
                    "sugestao": "Monitore os gastos desta categoria"
                }
                for cat in top_categories[:3]
            ],
            "oportunidades_economia": [
                {
                    "descricao": "Negociação com fornecedores principais",
                    "economia_estimada": sum(cat.valor * 0.1 for cat in top_categories[:3]),
                    "como_implementar": "Entre em contato com fornecedores para renegociar",
                    "complexidade": "facil"
                }
            ],
            "recomendacoes_sazonais": [
                {
                    "recomendacao": f"Planeje compras para {self._get_epoca_agricola()}",
                    "justificativa": "Melhor momento para negociar preços",
                    "impacto_esperado": "Redução de 5-10% nos custos"
                }
            ],
            "score_insights": {
                "relevancia": 7,
                "especificidade": 6,
                "acionabilidade": 8
            },
            "_fallback": True
        }