#!/usr/bin/env python3
"""
Script para testar o endpoint de upload localmente
"""
import requests
import os
import sys

# Caminho do arquivo de teste
test_file = "test_data.csv"

if not os.path.exists(test_file):
    print(f"❌ Arquivo de teste não encontrado: {test_file}")
    sys.exit(1)

# URL do endpoint
url = "http://localhost:8000/api/upload/"

print("📤 Enviando arquivo para análise...")

try:
    with open(test_file, 'rb') as f:
        files = {'file': ('demonstrativos.csv', f, 'text/csv')}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Análise concluída com sucesso!")
        print(f"⏱️  Tempo de processamento: {data['processing_time']}s")
        
        if data.get('analysis'):
            analysis = data['analysis']
            print(f"\n💰 Total gasto: R$ {analysis['total_gasto']:,.2f}")
            print(f"📊 Número de transações: {analysis['numero_transacoes']}")
            
            print("\n🏆 Top 5 Categorias:")
            for i, cat in enumerate(analysis['top_categorias'], 1):
                print(f"{i}. {cat['nome']}: R$ {cat['valor']:,.2f} ({cat['percentual']}%)")
                if cat.get('variacao_mensal'):
                    print(f"   ↗️ Variação mensal: {cat['variacao_mensal']}%")
            
            print(f"\n⚠️  Alertas: {len(analysis['alertas'])} encontrados")
            for alert in analysis['alertas'][:3]:  # Mostra apenas 3 primeiros
                icon = "🚨" if alert['tipo'] == 'urgent' else "⚠️"
                print(f"{icon} {alert['mensagem']}")
                
    else:
        print(f"❌ Erro: {response.status_code}")
        print(response.json())
        
except requests.exceptions.ConnectionError:
    print("❌ Erro: Não foi possível conectar ao servidor.")
    print("Certifique-se de que o backend está rodando (make dev)")
except Exception as e:
    print(f"❌ Erro inesperado: {e}")