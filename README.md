# Rural Insights - Análise Financeira Rural com IA

## 🌾 Visão Geral

Rural Insights é uma plataforma avançada de análise financeira desenvolvida especificamente para o agronegócio brasileiro. Utiliza inteligência artificial para processar extratos bancários e fornecer insights acionáveis para produtores rurais, cooperativas e instituições financeiras.

### ✨ Principais Funcionalidades

- **📊 Análise Inteligente de Extratos**: Upload de CSV com processamento automático e categorização via IA
- **🎯 Score de Saúde Financeira**: Avaliação em tempo real da situação financeira rural
- **📈 Simulador de Cenários**: Projeções e análises what-if para tomada de decisão
- **📱 Exportação Avançada**: 6 formatos de exportação incluindo PDF com gráficos e WhatsApp
- **🚀 Performance Otimizada**: Lazy loading, cache inteligente e processamento assíncrono
- **📱 PWA Ready**: Funciona offline e pode ser instalado como app

## 🛠️ Tecnologias Utilizadas

### Backend
- **FastAPI**: Framework web moderno e de alta performance
- **Python 3.11+**: Linguagem principal do backend
- **OpenAI GPT-4**: Análise inteligente e categorização
- **Pandas**: Processamento de dados financeiros
- **Docker**: Containerização e deploy

### Frontend
- **React 18**: Interface moderna e reativa
- **TypeScript**: Type safety e melhor DX
- **Vite**: Build tool ultra-rápida
- **TailwindCSS + DaisyUI**: Estilização moderna e responsiva
- **Framer Motion**: Animações fluidas
- **Chart.js + Recharts**: Visualizações de dados
- **jsPDF**: Geração de relatórios PDF

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- Chave de API da OpenAI
- Node.js 18+ (para desenvolvimento local)
- Python 3.11+ (para desenvolvimento local)

### Configuração Rápida com Docker

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/rural-insights.git
cd rural-insights
```

2. Configure as variáveis de ambiente:
```bash
# Backend - Crie um arquivo backend/.env
OPENAI_API_KEY=sua_chave_aqui
CACHE_TTL=3600
```

3. Execute com Docker Compose:
```bash
docker-compose up --build
```

4. Acesse a aplicação:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Documentação API: http://localhost:8000/docs

### Desenvolvimento Local

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📋 Estrutura do Projeto

```
rural-insights/
├── backend/
│   ├── main.py              # Entry point da API
│   ├── services/            
│   │   ├── ai_analyzer.py    # Análise com GPT-4
│   │   ├── csv_processor.py  # Processamento de CSV
│   │   └── cache.py          # Sistema de cache
│   ├── routes/              
│   │   ├── upload.py         # Upload de arquivos
│   │   └── insights.py       # Endpoints de insights
│   └── requirements.txt      
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Serviços e APIs
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utilitários
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml        # Orquestração dos containers
├── Makefile                 # Comandos úteis
└── README.md
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
make dev              # Inicia ambiente de desenvolvimento
make logs             # Visualiza logs dos containers
make shell-backend    # Acessa shell do backend
make shell-frontend   # Acessa shell do frontend

# Build e Deploy
make build           # Build de produção
make up              # Inicia containers
make down            # Para containers
make restart         # Reinicia containers

# Manutenção
make clean           # Remove containers e volumes
make prune           # Limpa recursos Docker não utilizados
```

## 📱 Funcionalidades de Exportação

O sistema oferece 6 opções avançadas de exportação:

### PDF
1. **PDF Completo**: Relatório multi-página com gráficos Chart.js, design profissional
2. **PDF Simples**: Versão text-only para impressão rápida

### WhatsApp
3. **WhatsApp Completo**: Relatório detalhado com todos os insights
4. **WhatsApp Resumo**: Principais pontos e recomendações
5. **WhatsApp Express**: Ultra-resumido para compartilhamento rápido

### Online
6. **Link Compartilhável**: Gera link curto para acesso online do relatório

## 🎨 Design System

- **Cores Principais**: 
  - Verde-safra (#10B981)
  - Terra-fértil (#92400E)
  - Dourado-milho (#F59E0B)
- **Tipografia**: Inter, system fonts
- **Componentes**: DaisyUI + customizações
- **Animações**: Framer Motion

## 🔐 Segurança

- Todas as comunicações são criptografadas via HTTPS
- Dados sensíveis são processados em memória e não persistidos
- Cache temporário com expiração automática
- Sanitização de inputs para prevenir injeções
- Rate limiting implementado na API

## 🧪 Testes

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## 🚀 Deploy em Produção

### Docker Compose (Recomendado)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Variáveis de Ambiente Necessárias
- `OPENAI_API_KEY`: Chave da API OpenAI
- `FRONTEND_URL`: URL do frontend (para CORS)
- `CACHE_TTL`: Tempo de vida do cache em segundos

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- Backend: Black formatter, isort, flake8
- Frontend: ESLint, Prettier
- Commits: Conventional Commits

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Equipe

- **Desenvolvimento**: Equipe Rural Insights
- **IA e Análise**: Powered by OpenAI GPT-4
- **Design**: Interface moderna e intuitiva

## 📞 Suporte

- Email: suporte@ruralinsights.com.br
- Documentação: [docs.ruralinsights.com.br](https://docs.ruralinsights.com.br)

---

Feito com ❤️ para o agronegócio brasileiro 🌾