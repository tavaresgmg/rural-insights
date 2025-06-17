#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.score_calculator import FinancialHealthScoreCalculator
import json

# Dados de teste (similar ao que seria retornado pelo CSV processor)
test_data = {
    'top_categories': [
        {'categoria': 'COMBUSTÍVEL', 'valor': 5000.0, 'percentual': 25.0},
        {'categoria': 'NUTRIÇÃO', 'valor': 4000.0, 'percentual': 20.0},
        {'categoria': 'MÃO DE OBRA FIXA', 'valor': 3000.0, 'percentual': 15.0},
        {'categoria': 'FINANCIAMENTO', 'valor': 2000.0, 'percentual': 10.0},
        {'categoria': 'MANUTENÇÃO', 'valor': 1500.0, 'percentual': 7.5}
    ],
    'monthly_evolution': [
        {'mes': 'Jan', 'valor': 8000.0},
        {'mes': 'Fev', 'valor': 7500.0},
        {'mes': 'Mar', 'valor': 9000.0},
        {'mes': 'Abr', 'valor': 8500.0}
    ],
    'anomalies': [
        {'categoria': 'COMBUSTÍVEL', 'impacto': 15.0},
        {'categoria': 'NUTRIÇÃO', 'impacto': -10.0}
    ],
    'total_gasto': 20000.0,
    'numero_transacoes': 150
}

def test_score_calculation():
    print("🧪 Testando Calculadora de Score de Saúde Financeira...")
    
    calculator = FinancialHealthScoreCalculator()
    result = calculator.calculate_score(test_data)
    
    print("\n📊 Resultado do Score:")
    print(f"Score Total: {result['score_total']}")
    print(f"Nível: {result['nivel']}")
    print(f"Posição Regional: {result['benchmark']['posicao_regional']}")
    print(f"Cultura Detectada: {result['benchmark']['cultura_detectada']}")
    
    print("\n🏗️ Componentes:")
    for nome, dados in result['componentes'].items():
        print(f"  {nome.title()}: {dados['score']} ({dados['status']})")
    
    print(f"\n📈 Tendência: {result['tendencia']['direcao']} ({result['tendencia']['variacao']}%)")
    
    print(f"\n💡 Recomendações ({len(result['recomendacoes'])}):")
    for rec in result['recomendacoes'][:2]:  # Mostra apenas 2
        print(f"  • {rec['categoria']}: {rec['acao'][:60]}...")
    
    print("\n✅ Teste completado com sucesso!")
    return result

if __name__ == "__main__":
    try:
        result = test_score_calculation()
        print(f"\n🎯 JSON completo salvo em test_score_result.json")
        
        with open('test_score_result.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        sys.exit(1)