# 🌾 Rural Insights AI

Aplicação web revolucionária para análise financeira rural com IA, gerando insights acionáveis e economia real para pequenos produtores.

## 🚀 Quick Start

```bash
# Desenvolvimento com Docker
make dev

# Ou manualmente
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## 🛠️ Stack Tecnológica

- **Backend**: FastAPI + Python 3.12
- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: TailwindCSS + DaisyUI
- **Visualizações**: Recharts
- **IA**: OpenAI GPT-4
- **Processamento**: Pandas

## 📁 Estrutura do Projeto

```
rural-insights/
├── backend/
│   ├── api/
│   │   ├── routes/      # Endpoints da API
│   │   └── middleware/  # Middlewares
│   ├── services/        # Lógica de negócio
│   ├── schemas/         # Modelos Pydantic
│   ├── core/           # Configurações
│   └── main.py         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/      # Páginas
│   │   ├── hooks/      # Custom hooks
│   │   └── services/   # API client
│   └── index.html
└── docker-compose.yml
```

## 🎨 Design System

- **Cores**: Verde-safra (#10B981), Terra-fértil (#92400E), Dourado-milho (#F59E0B)
- **Fonte**: Poppins
- **Tema**: Rural moderno inspirado em fintechs

## 📊 Features

- Upload e processamento de CSV financeiro
- Análise com IA de gastos e tendências
- Score de Saúde Financeira Rural
- Simulador de Cenários
- Export para WhatsApp/PDF
- PWA com modo offline

## 🔧 Comandos Úteis

```bash
make help         # Mostrar comandos disponíveis
make dev          # Iniciar desenvolvimento
make build        # Build para produção
make test         # Rodar testes
make logs         # Ver logs
```