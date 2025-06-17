#!/usr/bin/env python3
"""
Script para testar integração com IA
"""
import asyncio
import os
from datetime import datetime
from services.ai_analyzer import AIAnalyzer
from schemas.analysis import TopCategory, Alert, AlertType

# Configura API key para teste
os.environ["OPENAI_API_KEY"] = "sk-test-key"  # Substituir com chave real

async def test_ai_insights():
    analyzer = AIAnalyzer()
    
    # Dados de exemplo
    top_categories = [
        TopCategory(
            nome="COMBUSTÍVEL",
            valor=7979649.00,
            percentual=4.39,
            transacoes=30,
            media_por_transacao=265988.30,
            variacao_mensal=-20.38
        ),
        TopCategory(
            nome="MÃO DE OBRA FIXA",
            valor=14889792.00,
            percentual=8.19,
            transacoes=172,
            media_por_transacao=86568.00,
            variacao_mensal=12.27
        ),
        TopCategory(
            nome="NUTRIÇÃO",
            valor=5459195.00,
            percentual=3.0,
            transacoes=27,
            media_por_transacao=202192.00,
            variacao_mensal=5.5
        )
    ]
    
    existing_alerts = [
        Alert(
            tipo=AlertType.URGENT,
            categoria="COMBUSTÍVEL",
            mensagem="Combustível com preço acima da média regional",
            impacto_estimado=150000
        )
    ]
    
    print("🤖 Testando análise com IA...")
    
    try:
        insights = await analyzer.analyze_financial_data(
            top_categories=top_categories,
            total_gasto=181829798.00,
            num_transacoes=793,
            periodo={"inicio": "01/01/2024", "fim": "31/12/2024"},
            monthly_evolution={},
            existing_alerts=existing_alerts
        )
        
        print("\n✅ Insights gerados com sucesso!")
        
        if insights.get("_fallback"):
            print("⚠️  Usando insights de fallback (sem IA)")
        else:
            print("🎯 Insights gerados por IA")
        
        print("\n📊 Principais insights:")
        for i, insight in enumerate(insights.get("insights_principais", [])[:3], 1):
            print(f"\n{i}. {insight.get('mensagem')}")
            print(f"   💰 Impacto: R$ {insight.get('valor_impacto', 0):,.2f}")
            print(f"   ✅ Ação: {insight.get('acao_recomendada')}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    asyncio.run(test_ai_insights())