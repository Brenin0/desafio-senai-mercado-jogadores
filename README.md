# Passe

Aplicação web fullstack do estudo de caso SENAI/PE – CÓD. 237 Desenvolvedor I (Fullstack): o mercado de
jogadores de uma liga fictícia, com jogadores, clubes, compra e venda, histórico de transações, escalação,
partidas e classificação.

- **Backend:** API REST em NestJS, na pasta `backend/`.
- **Frontend:** React com Vite, na pasta `frontend/`.
- **Banco de dados:** PostgreSQL 16, iniciado pelo Docker Compose.

## Pré-requisitos

| Ferramenta | Versão | Observação |
| --- | --- | --- |
| Node.js (com npm) | 22 LTS (testado com 22.23 e npm 10.9) | backend e frontend |
| Docker Engine com Docker Compose (comando `docker compose`) | testado com Docker 29 | inicia o banco |
| PostgreSQL | 16 | imagem pública `postgres:16-alpine`, iniciada pelo `docker compose`; não precisa instalar |

## Como executar (Ubuntu 24.04)

Os comandos partem da raiz do repositório. Os arquivos de trava das dependências estão versionados
(`backend/package-lock.json` e `frontend/package-lock.json`), e o `npm ci` instala exatamente as versões
deles.

**1. Banco de dados** (na raiz do repositório):

```bash
docker compose up -d --wait db
```

**2. Backend** (em um terminal, a partir da raiz do repositório):

```bash
cd backend
cp .env.example .env
npm ci
npm run build
npm run start:prod
```

Origem da API: **`http://localhost:3000`** (as rotas ficam em `/api/v1`).

**3. Frontend** (em outro terminal, a partir da raiz do repositório):

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

URL do frontend: **`http://localhost:5173`**

## Variáveis de ambiente

Cada pasta tem um `.env.example`, que o passo a passo acima copia para `.env`.

| Variável | Pasta | Valor no `.env.example` | Para que serve |
| --- | --- | --- | --- |
| `PORT` | `backend` | `3000` | Porta HTTP da API. |
| `FRONTEND_ORIGIN` | `backend` | `http://localhost:5173` | Única origem liberada no CORS, sem caminho e sem barra no final. Obrigatória: sem ela, a API não sobe e diz o motivo. |
| `VITE_API_URL` | `frontend` | `http://localhost:3000` | Origem da API, sem `/api/v1` (o frontend acrescenta). Se faltar, o frontend usa `http://localhost:3000`. |

## Testes, lint, documentação da API e logs

Na pasta `backend`:

```bash
npm test               # testes unitários (Jest); terminam sozinhos
npm run test:e2e       # testes das respostas HTTP (Jest e Supertest); terminam sozinhos
npm run lint           # ESLint; só verifica
npm run format:check   # Prettier; só verifica, sem alterar arquivos
```

Na pasta `frontend`:

```bash
npm test               # testes de componente (Vitest e Testing Library); terminam sozinhos
npm run lint           # ESLint; só verifica
npm run format:check   # Prettier; só verifica, sem alterar arquivos
```

- **Documentação interativa da API (Swagger):** com a API no ar, `http://localhost:3000/api/docs`. O
  documento OpenAPI fica em `http://localhost:3000/api/docs-json`.
- **Logs:** cada requisição gera uma linha na saída da API, pelo Logger do NestJS, com data e hora,
  método, caminho, status e duração. Exemplo:
  `[Nest] 23960  - 20/10/2026, 23:16:15     LOG [HTTP] GET /api/v1/players 200 9ms`

## Estrutura de pastas

```text
/
├── backend/                 API REST (NestJS)
│   ├── src/
│   │   ├── common/          filtro global de erros, pipes de validação e middlewares (log e JSON inválido)
│   │   ├── config/          validação das variáveis de ambiente e Swagger
│   │   ├── app.module.ts
│   │   ├── app.setup.ts     configuração única da aplicação: prefixo, CORS, validação, erros e Swagger
│   │   └── main.ts
│   └── test/                testes das respostas HTTP (e2e)
├── frontend/                interface web (React e Vite)
│   └── src/
│       ├── api/             cliente HTTP: único lugar que chama a API
│       ├── components/      componentes compartilhados (layout e cabeçalho de página)
│       ├── features/        uma pasta por tela
│       ├── lib/             configuração do TanStack Query
│       └── routes.tsx       rotas da interface
├── docs/                    enunciado, barema, plano, checklist e diário de uso de IA
└── docker-compose.yml       PostgreSQL 16
```

## Bibliotecas

Stack obrigatória: Node.js 22 com TypeScript e NestJS 11 no backend; React 19 com Vite 8 no frontend;
PostgreSQL 16.

### Backend

| Biblioteca | Motivo |
| --- | --- |
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | NestJS, o framework da stack obrigatória, sobre o Express. |
| `reflect-metadata`, `rxjs` | Exigidas pelo NestJS. |
| `@nestjs/config` | Lê o `.env` e valida as variáveis de ambiente na subida. |
| `class-validator`, `class-transformer` | Validação declarativa da entrada da API e das variáveis de ambiente. |
| `@nestjs/swagger` | Documentação interativa da API em `/api/docs`. |
| `@nestjs/cli`, `@nestjs/schematics` | Build e execução do NestJS (`nest build` e `nest start`). |
| `typescript` | Linguagem do projeto. |
| `jest`, `ts-jest`, `@nestjs/testing` | Testes automatizados. |
| `supertest` | Testes das respostas HTTP da API. |
| `eslint`, `@eslint/js`, `typescript-eslint`, `globals` | Lint do código TypeScript. |
| `prettier`, `eslint-plugin-prettier`, `eslint-config-prettier` | Formatação do código, conferida também pelo lint. |
| `@types/express`, `@types/jest`, `@types/node`, `@types/supertest` | Tipos do TypeScript para essas bibliotecas. |

### Frontend

| Biblioteca | Motivo |
| --- | --- |
| `react`, `react-dom` | React, da stack obrigatória. |
| `vite`, `@vitejs/plugin-react` | Vite, da stack obrigatória: servidor de desenvolvimento e build. |
| `react-router` | Rotas entre as telas, no modo biblioteca. |
| `@tanstack/react-query` | Busca e cache dos dados da API, com estados de carregamento e erro e atualização da tela depois de cada ação. |
| `tailwindcss`, `@tailwindcss/vite` | Estilo da interface. |
| `typescript` | Linguagem do projeto. |
| `vitest`, `jsdom` | Testes automatizados, com um navegador simulado. |
| `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom` | Testes de componente. |
| `eslint`, `@eslint/js`, `typescript-eslint`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` | Lint do código TypeScript e React. |
| `prettier`, `eslint-config-prettier` | Formatação do código, sem conflito com o lint. |
| `@types/node`, `@types/react`, `@types/react-dom` | Tipos do TypeScript para essas bibliotecas. |

## Decisões e premissas

Detalhes que o enunciado deixou à escolha do candidato:

- **Mensagens de erro** em português, sempre no formato `{ "message": "..." }`.
- **Método não previsto num caminho que existe** (como `DELETE /api/v1/clubs/1`): `404`, com `message`.
- **Corpo que não é objeto** (array, texto, número, `null` ou booleano): `400`, com a mesma mensagem em
  todos os casos.
- **Corpo enviado a um endpoint sem corpo** (consultas, exclusão e venda): JSON válido é ignorado; JSON
  malformado recebe `400`, como em qualquer outro endpoint.
- **Erro inesperado:** `500` com uma mensagem genérica; o detalhe vai só para o log da API.
- **Log:** uma linha por requisição, gravada quando a resposta termina, inclusive nas recusas.
- **`npm test`** roda só os testes que não dependem do banco; os testes das respostas HTTP ficam em
  `npm run test:e2e`.
- **Portas:**
  - API na `3000`;
  - frontend na `5173` fixa: se a porta estiver ocupada, o Vite para em vez de trocar de porta;
  - banco na `5433` do computador, para não conflitar com um PostgreSQL instalado localmente na `5432`.
- **Frontend:**
  - o endereço inicial (`/`) abre a lista de jogadores;
  - uma consulta que falha por rede ou por erro do servidor é repetida uma vez;
  - recusas da API (`4xx`) e ações nunca são repetidas.
