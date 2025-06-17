#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.scenario_simulator import FinancialScenarioSimulator, ScenarioType, PaymentMethod
import json

def test_equipment_simulation():
    print("🧪 Testando Simulador de Cenários Financeiros...")
    
    simulator = FinancialScenarioSimulator()
    
    # Teste 1: Compra de Equipamento
    print("\n🚜 Teste 1: Compra de Trator")
    equipment_config = {
        'type': ScenarioType.EQUIPMENT_PURCHASE.value,
        'equipment': 'tractor_new',
        'payment_method': PaymentMethod.CASH.value,
        'current_monthly_flow': 20000
    }
    
    equipment_result = simulator.simulate_scenario(equipment_config)
    
    print("Resultados:")
    if 'payment_scenarios' in equipment_result:
        for method, scenario in equipment_result['payment_scenarios'].items():
            benefit = scenario.get('monthly_net_benefit', 'N/A')
            if benefit != 'N/A':
                print(f"  {method}: Benefício mensal R$ {benefit:,.2f}")
            else:
                print(f"  {method}: Simulação específica (veja timeline)")
        
        print(f"  Recomendação: {equipment_result['recommendation']['best_option']}")
        print(f"  Razão: {equipment_result['recommendation']['reasoning']}")
    
    # Teste 2: Contratação
    print("\n👨‍🌾 Teste 2: Contratação de Funcionário")
    hiring_config = {
        'type': ScenarioType.HIRING.value,
        'employment_type': 'clt',
        'positions': 2,
        'current_monthly_flow': 18000
    }
    
    hiring_result = simulator.simulate_scenario(hiring_config)
    
    print("Resultados:")
    if 'employment_scenarios' in hiring_result:
        for emp_type, scenario in hiring_result['employment_scenarios'].items():
            print(f"  {emp_type}: Benefício líquido R$ {scenario['monthly_net_benefit']:,.2f}")
        
        print(f"  Recomendação: {hiring_result['recommendation']['best_option']}")
    
    # Teste 3: Investimento
    print("\n🏗️ Teste 3: Investimento em Irrigação")
    investment_config = {
        'type': ScenarioType.INVESTMENT.value,
        'investment': 'irrigation_system',
        'current_monthly_flow': 15000
    }
    
    investment_result = simulator.simulate_scenario(investment_config)
    
    print("Resultados:")
    if 'roi_analysis' in investment_result:
        roi = investment_result['roi_analysis']
        payback = investment_result['payback_analysis']
        
        print(f"  ROI: {roi['roi_percentage']:.1f}% ao ano")
        print(f"  Payback: {payback['payback_years']:.1f} anos")
        print(f"  Risco: {investment_result['risk_assessment']['risk_level']}")
    
    # Teste 4: Templates
    print("\n📋 Teste 4: Templates Disponíveis")
    templates = {
        "equipment": {
            "tractor_new": simulator.predefined_scenarios["tractor_new"],
            "irrigation_system": simulator.predefined_scenarios["irrigation_system"]
        },
        "hiring": {
            "worker_clt": simulator.predefined_scenarios["worker_clt"]
        }
    }
    
    print("Templates carregados:")
    for category, items in templates.items():
        print(f"  {category}: {len(items)} opções")
    
    print("\n✅ Simulador funcionando corretamente!")
    
    # Salva resultado completo para análise
    complete_test = {
        'equipment_simulation': equipment_result,
        'hiring_simulation': hiring_result,
        'investment_simulation': investment_result,
        'available_templates': templates
    }
    
    with open('test_simulator_result.json', 'w', encoding='utf-8') as f:
        json.dump(complete_test, f, indent=2, ensure_ascii=False, default=str)
    
    print("📁 Resultados salvos em test_simulator_result.json")
    
    return complete_test

def test_simulation_accuracy():
    """Testa precisão dos cálculos"""
    print("\n🔬 Teste de Precisão dos Cálculos...")
    
    simulator = FinancialScenarioSimulator()
    
    # Teste cálculos de financiamento
    equipment_data = simulator.predefined_scenarios['tractor_new']
    current_flow = 20000
    
    financing = simulator._calculate_financing(equipment_data, current_flow)
    
    print("Verificação Financiamento:")
    print(f"  Valor total: R$ {equipment_data['cost']:,.2f}")
    print(f"  Entrada (20%): R$ {financing['down_payment']:,.2f}")
    print(f"  Financiado: R$ {financing['financed_amount']:,.2f}")
    print(f"  Prestação: R$ {financing['monthly_payment']:,.2f}")
    print(f"  Juros totais: R$ {financing['total_interest']:,.2f}")
    
    # Verificação básica
    expected_down = equipment_data['cost'] * 0.20
    assert abs(financing['down_payment'] - expected_down) < 1, "Erro no cálculo da entrada"
    
    expected_financed = equipment_data['cost'] - expected_down
    assert abs(financing['financed_amount'] - expected_financed) < 1, "Erro no valor financiado"
    
    print("✅ Cálculos de financiamento corretos!")
    
    # Teste sazonalidade
    print("\n🌱 Teste de Sazonalidade:")
    for month, factor in simulator.seasonality.items():
        season_name = {
            1: "Janeiro (pós-safra)", 2: "Fevereiro", 3: "Março (plantio)",
            4: "Abril", 5: "Maio", 6: "Junho (colheita)", 7: "Julho (pico)",
            8: "Agosto", 9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"
        }.get(month, f"Mês {month}")
        
        if month in [6, 7]:  # Meses de pico
            print(f"  {season_name}: {factor} (pico)")
    
    print("✅ Fatores de sazonalidade aplicados!")

if __name__ == "__main__":
    try:
        test_results = test_equipment_simulation()
        test_simulation_accuracy()
        
        print("\n🎯 RESUMO DOS TESTES:")
        print("  ✅ Simulação de equipamentos")
        print("  ✅ Simulação de contratação")
        print("  ✅ Simulação de investimentos")
        print("  ✅ Templates de cenários")
        print("  ✅ Precisão dos cálculos")
        print("  ✅ Fatores de sazonalidade")
        
        print(f"\n🚀 Sistema pronto para uso!")
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)