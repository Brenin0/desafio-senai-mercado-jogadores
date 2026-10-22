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
npm run db:migrate
npm run build
npm run start:prod
```

O `npm run db:migrate` cria as tabelas no banco (veja [Banco de dados](#banco-de-dados)).

Origem da API: **`http://localhost:3000`** (as rotas ficam em `/api/v1`).

**3. Frontend** (em outro terminal, a partir da raiz do repositório):

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

URL do frontend: **`http://localhost:5173`**

## Banco de dados

O banco é o PostgreSQL 16 do `docker-compose.yml`. As tabelas são criadas pelas migrations versionadas em
`backend/prisma/migrations`. O banco criado ou recriado por estes passos começa vazio, sem jogadores,
clubes, transações nem partidas.

**Criar** (são os passos 1 e 2 de "Como executar", a partir da raiz do repositório):

```bash
docker compose up -d --wait db
cd backend
cp .env.example .env
npm ci
npm run db:migrate
```

**Recriar do zero** (com o banco no ar, a partir da raiz do repositório). Apaga todos os dados, cria as
tabelas de novo pelas migrations e deixa o banco vazio:

```bash
cd backend
npm run db:reset
```

## Variáveis de ambiente

Cada pasta tem um `.env.example`, que o passo a passo acima copia para `.env`.

| Variável | Pasta | Valor no `.env.example` | Para que serve |
| --- | --- | --- | --- |
| `PORT` | `backend` | `3000` | Porta HTTP da API. |
| `FRONTEND_ORIGIN` | `backend` | `http://localhost:5173` | Única origem liberada no CORS, sem caminho e sem barra no final. Obrigatória: sem ela, a API não sobe e diz o motivo. |
| `DATABASE_URL` | `backend` | `postgresql://passe:passe@localhost:5433/passe?schema=public` | Conexão do Prisma com o PostgreSQL do `docker-compose.yml`, na porta 5433 do computador. Obrigatória: sem ela, a API não sobe e diz o motivo. Os testes e2e usam o mesmo servidor, num banco separado (veja [Testes](#testes-lint-documentação-da-api-e-logs)). |
| `VITE_API_URL` | `frontend` | `http://localhost:3000` | Origem da API, sem `/api/v1` (o frontend acrescenta). Se faltar, o frontend usa `http://localhost:3000`. |

## Testes, lint, documentação da API e logs

Na pasta `backend`:

```bash
npm test               # testes unitários (Jest), com as tabelas de exemplo do enunciado; não usam o banco
npm run test:e2e       # testes das respostas HTTP (Jest e Supertest); precisam do banco no ar
npm run lint           # ESLint; só verifica
npm run format:check   # Prettier; só verifica, sem alterar arquivos
```

Os dois comandos de teste terminam sozinhos. O `npm run test:e2e` precisa do banco no ar
(`docker compose up -d --wait db`, na raiz) e do `.env` da pasta `backend`. Ele usa um banco separado,
`passe_e2e`, no mesmo PostgreSQL: cria esse banco e aplica as migrations sozinho, apaga os dados dele
antes de cada teste e nunca mexe no banco da aplicação.

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
│   │   ├── clubs/           clubes: controller, service, repository, DTOs e validadores
│   │   ├── common/          filtro global de erros, relógio, pipes, validadores reutilizáveis e middlewares
│   │   ├── config/          validação das variáveis de ambiente e Swagger
│   │   ├── domain/          regras de cálculo puras (sem NestJS e sem Prisma), uma por arquivo, com os testes
│   │   ├── league/          liga (por enquanto, a saída do titular da escalação)
│   │   ├── players/         jogadores: controller, service, repository, DTOs e validadores
│   │   ├── prisma/          conexão com o banco e transação usada pelos services
│   │   ├── app.module.ts
│   │   ├── app.setup.ts     configuração única da aplicação: prefixo, CORS, validação, erros e Swagger
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma    as 7 tabelas do banco
│   │   └── migrations/      migrations versionadas, aplicadas por db:migrate e db:reset
│   └── test/                testes das respostas HTTP (e2e), num banco separado
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
| `prisma` | ORM: descreve as tabelas em `prisma/schema.prisma`, gera as migrations e as aplica (`db:migrate` e `db:reset`). |
| `@prisma/client` | Acesso da API ao banco, gerado a partir do schema durante o `npm ci`. |
| `decimal.js` | Contas com valores em moedas sem os erros do ponto flutuante, com arredondamento meio para longe do zero. |
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
  `npm run test:e2e`, que usa um banco separado (`passe_e2e`) e roda uma suíte por vez, porque cada teste
  começa com as tabelas vazias.
- **Portas:**
  - API na `3000`;
  - frontend na `5173` fixa: se a porta estiver ocupada, o Vite para em vez de trocar de porta;
  - banco na `5433` do computador, para não conflitar com um PostgreSQL instalado localmente na `5432`.
- **Banco de dados:**
  - tabelas e colunas com os nomes exatos do enunciado; no código, modelos e campos em inglês, ligados a
    esses nomes pelo `@@map` e pelo `@map` do Prisma;
  - nome único do clube (RN10): coluna extra `clubes.nome_normalizado`, com índice único, que guarda o nome
    depois da V4 e em minúsculas, mantendo os acentos ("Águias FC" e "águias fc" colidem; "Aguias FC" não);
    é `TEXT`, e não `VARCHAR(60)`, porque passar para minúsculas pode aumentar o texto (o "İ" vira 2
    caracteres);
  - índice único extra em `duelos_partida` (`partida_id`, `ordem`): uma partida não tem dois duelos com o
    mesmo número;
  - valores de lista (posição, condição, situação do contrato, tipo da transação, formação e atributo do
    duelo) gravados como texto, nos tamanhos do enunciado, sem tipo enum do PostgreSQL;
  - o `db:reset` usa `--skip-seed`, para o banco recriado nascer sempre vazio.
- **Regras de cálculo** (`backend/src/domain`):
  - valores em moedas calculados com `decimal.js` e arredondados uma única vez, no resultado final, para 2
    casas, com o meio para longe do zero; o limite de 50% do caixa (RN13) não é arredondado;
  - overall (RN06) e atributo × 0,85 da partida (RN20) arredondados para o inteiro, com o meio para cima;
  - ordem alfabética feita na aplicação, e não pelo banco: minúsculas, decomposição NFD sem as marcas de
    acento (categoria Unicode Mn) e comparação por ponto de código; o empate é desfeito pelo id;
  - na V4, só o U+0020 conta como espaço, e caractere de controle é qualquer um da categoria Unicode Cc;
  - dias restantes (RN15): diferença em milissegundos entre o fim da fidelidade e o momento da operação,
    dividida por 24 horas e arredondada para cima;
  - datas nas respostas com os segundos e sem os milissegundos, que são descartados (não arredondados); a
    conversão para `-03:00` não depende do fuso da máquina.
- **Validação e respostas da API:**
  - ordem das recusas: primeiro o formato (`400`, no corpo e na query), depois a existência (`404`: id da
    URL e `club_id` da query), depois as regras de negócio (`409`); no `PUT` de jogador, a posição é
    conferida antes da idade; na criação de clube, o limite de 20 vem antes do nome e da sigla;
  - uma mensagem por campo recusado, a da primeira regra violada; campos diferentes vêm separados por `; `;
  - palavra: um pedaço sem letra entre espaços é aceito, mas não conta como palavra (`"Ana - Lima"` tem 2
    palavras);
  - além da V4, nenhuma normalização de texto: o nome é gravado e devolvido como chegou, com o tamanho
    contado em pontos de código; texto que fica vazio depois da V4 é recusado com `400`;
  - sigla do clube: não passa pela V4 (`" AGU"` é recusada); a "primeira letra do nome" é o primeiro
    caractere da categoria Unicode L, comparado sem maiúsculas e sem acentos (em "F.C. Recife", o F);
  - query params: parâmetro da tabela repetido (como `?page=1&page=2`) é recusado com `400`; id fora do
    formato na query também é `400` (na URL, é `404`);
  - `Location` como caminho a partir da raiz do servidor, como `/api/v1/players/2`;
  - enviar a condição atual no `PATCH /players/{id}/condition` responde `200` sem gravar nada;
  - listagem de jogadores: posição, condição, clube, livre e idade são filtrados no banco; a busca sem
    acentos, a faixa de valor de mercado (que não é coluna), a ordenação e a paginação são feitas pelo
    domínio;
  - elenco do clube: os jogadores com contrato `ATIVO` com ele;
  - Swagger: os campos cujo tipo é outra classe declaram o tipo no `@ApiProperty`; numa pasta com acento
    (como `C:\Users\Usuário`), o plugin do Swagger aponta esses tipos para um caminho de `src` que não
    existe depois do build, e o `/api/docs` deixaria de abrir.
- **Frontend:**
  - o endereço inicial (`/`) abre a lista de jogadores;
  - uma consulta que falha por rede ou por erro do servidor é repetida uma vez;
  - recusas da API (`4xx`) e ações nunca são repetidas.
