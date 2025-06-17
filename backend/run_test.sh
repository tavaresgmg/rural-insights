#!/bin/bash
# Script para testar o backend localmente

echo "🚀 Iniciando servidor FastAPI..."

# Ativa o ambiente virtual
source venv/bin/activate

# Inicia o servidor em background
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
SERVER_PID=$!

# Aguarda servidor iniciar
echo "⏳ Aguardando servidor iniciar..."
sleep 5

# Executa o teste
echo "🧪 Executando teste de upload..."
python test_upload.py

# Para o servidor
echo "🛑 Parando servidor..."
kill $SERVER_PID

echo "✅ Teste concluído!"