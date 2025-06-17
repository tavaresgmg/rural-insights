"""
Prompts especializados para análise financeira rural
"""

# Informações de contexto agrícola brasileiro
CONTEXTO_AGRICOLA = {
    "culturas_principais": {
        "soja": {
            "plantio": "outubro-dezembro",
            "colheita": "fevereiro-abril",
            "custos_medios_ha": 4500.00
        },
        "milho": {
            "plantio": "janeiro-março",
            "colheita": "junho-agosto", 
            "custos_medios_ha": 3800.00
        },
        "cafe": {
            "plantio": "outubro-dezembro",
            "colheita": "maio-setembro",
            "custos_medios_ha": 12000.00
        },
        "pecuaria": {
            "custos_medios_cabeca_mes": 45.00,
            "categorias_principais": ["NUTRIÇÃO", "SANIDADE", "MÃO DE OBRA"]
        }
    },
    "insumos_referencia": {
        "COMBUSTÍVEL": {
            "diesel": {"preco_medio_litro": 6.20, "variacao_aceitavel": 0.15},
            "gasolina": {"preco_medio_litro": 5.80, "variacao_aceitavel": 0.20}
        },
        "MÃO DE OBRA": {
            "diarista": {"valor_medio": 150.00, "variacao_regional": 0.20},
            "mensalista": {"valor_medio": 2500.00, "variacao_regional": 0.15}
        },
        "NUTRIÇÃO": {
            "racao_bovino": {"preco_medio_kg": 2.10, "consumo_dia_cabeca": 2.5},
            "sal_mineral": {"preco_medio_kg": 3.50, "consumo_mes_cabeca": 1.5}
        }
    },
    "alertas_sazonais": {
        "janeiro": ["Preparar para plantio safrinha", "Negociar insumos"],
        "fevereiro": ["Monitorar pragas", "Planejar colheita"],
        "março": ["Intensificar colheita", "Comercializar produção"],
        "abril": ["Finalizar colheita", "Preparar entressafra"],
        "maio": ["Manutenção equipamentos", "Planejar próxima safra"],
        "junho": ["Comprar insumos antecipado", "Reformar pastagens"],
        "julho": ["Preparar solo", "Contratar mão de obra"],
        "agosto": ["Iniciar preparo plantio", "Revisar maquinário"],
        "setembro": ["Últimos preparos", "Garantir sementes"],
        "outubro": ["Iniciar plantio", "Monitorar clima"],
        "novembro": ["Continuar plantio", "Aplicar defensivos"],
        "dezembro": ["Finalizar plantio", "Planejar tratos culturais"]
    }
}

# Templates de insights por categoria
INSIGHTS_TEMPLATES = {
    "COMBUSTÍVEL": [
        {
            "condicao": "preco_acima_media",
            "template": "Seu custo com combustível está R$ {diferenca:.2f}/litro acima da média regional. Considere: 1) Negociar contrato com posto, 2) Compra conjunta com vizinhos, 3) Revisar rotas e consumo"
        },
        {
            "condicao": "aumento_mensal_alto",
            "template": "Combustível aumentou {percentual}% este mês. Verifique: 1) Aumento de deslocamentos, 2) Manutenção de veículos, 3) Possível desperdício ou desvio"
        }
    ],
    "MÃO DE OBRA FIXA": [
        {
            "condicao": "custo_por_hectare_alto",
            "template": "Custo de mão de obra por hectare está {percentual}% acima do ideal. Avalie: 1) Produtividade da equipe, 2) Necessidade real de funcionários, 3) Automatização de processos"
        }
    ],
    "NUTRIÇÃO": [
        {
            "condicao": "consumo_acima_esperado",
            "template": "Consumo de ração {percentual}% acima do esperado para seu rebanho. Verifique: 1) Desperdício no cocho, 2) Qualidade da ração, 3) Conversão alimentar dos animais"
        }
    ]
}

# Benchmarks por porte de propriedade
BENCHMARKS = {
    "pequeno": {  # até 50 hectares
        "percentuais_ideais": {
            "MÃO DE OBRA": (15, 25),
            "COMBUSTÍVEL": (8, 15),
            "NUTRIÇÃO": (20, 35),
            "MANUTENÇÃO": (5, 10),
            "DEFENSIVOS": (10, 20)
        }
    },
    "medio": {  # 50-200 hectares
        "percentuais_ideais": {
            "MÃO DE OBRA": (12, 20),
            "COMBUSTÍVEL": (10, 18),
            "NUTRIÇÃO": (25, 40),
            "MANUTENÇÃO": (8, 15),
            "DEFENSIVOS": (15, 25)
        }
    }
}

def get_contexto_completo(mes: int, regiao: str = "Brasil") -> dict:
    """
    Retorna contexto completo para análise
    """
    return {
        "contexto_agricola": CONTEXTO_AGRICOLA,
        "insights_templates": INSIGHTS_TEMPLATES,
        "benchmarks": BENCHMARKS,
        "mes_atual": mes,
        "alertas_mes": CONTEXTO_AGRICOLA["alertas_sazonais"].get(
            ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
             "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][mes],
            []
        )
    }