# PlanejAula — Sistema de Gerenciamento de Planos de Aula

Sistema web completo para cadastro, organização e consulta de planos de aula, com **Smart Assist** por IA (Anthropic Claude) para sugestões pedagógicas inteligentes.

---

## Como executar (único comando)

```bash
# 1. Clone o repositório
git clone <seu-repo-url>
cd lesson-planner

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua ANTHROPIC_API_KEY

# 3. Suba a aplicação
docker-compose up --build
```

Acesse em: **http://localhost:3000**
API disponível em: **http://localhost:5000/api**

---

## Arquitetura

```
lesson-planner/
├── backend/               # API RESTful - Python/Flask
│   ├── app.py             # Ponto de entrada + factory
│   ├── models/
│   │   └── database.py    # SQLAlchemy models (LessonPlan)
│   ├── routes/
│   │   ├── lesson_plans.py  # CRUD endpoints
│   │   ├── ai_assist.py     # Smart Assist (Anthropic API)
│   │   └── health.py        # /health endpoint
│   ├── utils/
│   │   └── logging_config.py  # Logs estruturados em JSON
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # SPA - React 18
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ListPage.js    # Listagem com filtros e paginação
│   │   │   └── FormPage.js    # Formulário cadastro/edição
│   │   ├── components/
│   │   │   └── Layout.js      # Navbar e shell da aplicação
│   │   └── services/
│   │       └── api.js         # Axios client
│   ├── nginx.conf         # Proxy reverso para /api/*
│   └── Dockerfile         # Build multi-stage (Node + Nginx)
├── .github/workflows/
│   └── ci.yml             # GitHub Actions: lint + docker build
├── docker-compose.yml
└── .env.example
```

---

##  Stack Técnica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Backend | Python 3.12 + Flask 3 | Leve, produtivo, ecosystem rico |
| Banco de dados | SQLite (padrão) / PostgreSQL | SQLite p/ dev, Postgres p/ produção |
| ORM | SQLAlchemy + Flask-SQLAlchemy | Migrations simples, queries expressivas |
| Validação | marshmallow | Validação e deserialização de esquemas |
| IA | Anthropic Claude (claude-haiku) | Rápido, econômico, alta qualidade |
| Frontend | React 18 + React Router 6 | SPA moderno, ecosystem maduro |
| HTTP client | Axios | Interceptors para tratamento global de erros |
| Servidor web | Nginx | Serve build estático + proxy reverso |
| Containerização | Docker + Docker Compose | Ambiente reproduzível, deploy simples |
| CI | GitHub Actions | Lint automático a cada push |

---

## Endpoints da API

### Planos de Aula
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/lesson-plans` | Listar (com filtros, paginação, ordenação) |
| `GET` | `/api/lesson-plans/:id` | Buscar por ID |
| `POST` | `/api/lesson-plans` | Criar |
| `PUT` | `/api/lesson-plans/:id` | Atualizar |
| `DELETE` | `/api/lesson-plans/:id` | Excluir |

**Parâmetros de listagem:**
- `page`, `per_page` — paginação
- `search` — busca por título
- `discipline`, `tag`, `scheduled_date` — filtros
- `sort_by` (`title` | `created_at`), `sort_order` (`asc` | `desc`) — ordenação

### Smart Assist (IA)
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/ai/recommend` | Gerar sugestões de conteúdo |

**Body:** `{ title, discipline, summary }`
**Response:** `{ contents, support_resources, tags[3] }`

### Observabilidade
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Status do serviço e dependências |

---

## Smart Assist — Prompt Engineering

O backend instrui o modelo a atuar como **Assistente Pedagógico**:

```
Você é um Assistente Pedagógico especializado em criar planos de aula ricos.
Sua função é analisar o título, a disciplina e a ementa e sugerir:
1. Conteúdos complementares relevantes
2. Tópicos relacionados que enriquecem o aprendizado
3. Exatamente 3 tags categorizando a aula

Responda APENAS com um objeto JSON válido...
```

O response é JSON estruturado, parseado e aplicado automaticamente nos campos do formulário.

---

##  Observabilidade

Logs estruturados em JSON com timestamp, nível e contexto:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "INFO",
  "logger": "routes.ai_assist",
  "message": "[INFO] AI Request: Title=\"Introdução ao OSPF\", Discipline=\"Redes\", TokenUsage=180, Latency=1.4s"
}
```

##  Desenvolvimento local (sem Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start
```

---
