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
│   │   ├── league/          liga: escalação, partidas com os 6 duelos e classificação
│   │   ├── market/          mercado: compra, venda, histórico de transações e exportação CSV
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
│       ├── api/             cliente HTTP e funções por recurso: único lugar que chama a API
│       ├── hooks/           consultas e ações (TanStack Query) e as consultas atualizadas depois de cada ação
│       ├── components/      compartilhados: tabela, campo de formulário, aviso, janela, confirmação e paginação
│       ├── features/        uma pasta por tela: jogadores, clubes, página do clube, partidas e classificação
│       ├── lib/             moeda, data em Brasília, data digitada com -03:00, validação e TanStack Query
│       ├── test/            utilitários dos testes: API simulada, dados de exemplo e renderização
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
| `react-hook-form` | Estado dos formulários e validação antes do envio (obrigatórios, tamanho dos textos e faixas numéricas), com a mensagem junto ao campo. Usado com as regras próprias dele, sem Zod: o `@hookform/resolvers` 6 entra em conflito de dependências no `npm install`. |
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
- **Mercado (compra, venda, histórico e CSV):**
  - ordem das recusas da compra: primeiro o formato (`400`, inclusive o fim da fidelidade fora da janela),
    depois a existência (`404`: jogador, depois clube), depois as regras (`409`): jogador que não está
    livre, recompra pelo clube que já o vendeu, elenco com 12 jogadores e custo acima de 50% do caixa;
    na venda, `404` e depois `409` para jogador livre;
  - fim da fidelidade: estritamente depois do instante da compra e até 1.095 × 24 horas depois, inclusive;
    como a entrada não tem segundos, o minuto atual já passou e é recusado;
  - cada operação usa um único instante do servidor, com milissegundos: o mesmo das regras (janela da
    fidelidade e dias restantes) é gravado em `criado_em`, `iniciado_em` e `encerrado_em`;
  - pedidos simultâneos: a compra só põe o jogador no elenco se ele ainda estiver livre, e a venda só o
    libera se ele ainda estiver no clube; o segundo pedido recebe `409`, sem gravar nada;
  - recompra: qualquer venda anterior daquele clube com aquele jogador impede a compra;
  - o caixa muda só pela variação gravada na transação (negativa na compra, positiva na venda), o que
    mantém 300,00 + soma das variações = caixa atual;
  - histórico: `player_id` de um jogador que existe, mas não tem transações no clube, responde `200` com
    `data` vazio e `summary` zerado;
  - CSV: `text/csv; charset=utf-8` e `Content-Disposition: attachment; filename="historico-clube-{id}.csv"`;
    os erros continuam em JSON, sem esses cabeçalhos.
- **Liga (escalação, partidas e classificação):**
  - ordem das recusas da escalação: primeiro o formato (`400`), depois a existência (`404`: clube da URL,
    depois os jogadores, contando o excluído como inexistente), depois as regras (`409`): jogador fora do
    elenco do clube, jogador `DOENTE` e posições que não fecham a formação;
  - elenco, na escalação: os jogadores cujo clube é o da URL (os mesmos dos contratos `ATIVO`);
  - o `PUT` da escalação troca a formação e os 5 titulares na mesma transação; o `criado_em` de cada
    titular é o instante do servidor; `complete` é `true` só com a formação salva e os 5 titulares;
  - ordem das recusas da partida: primeiro o formato (`400`, inclusive o mandante igual ao visitante),
    depois a existência (`404`: mandante, depois visitante), depois a escalação completa (`409`: mandante,
    depois visitante);
  - partida: `played_at` é o instante do servidor, gravado com os milissegundos e devolvido sem eles; a
    resposta do `POST /matches` e do `GET /matches/{id}` é montada a partir do que foi gravado;
  - `result` não é coluna: sai dos gols gravados, pela mesma função do motor da partida;
  - `club_name` das partidas é o nome do clube, que não muda, porque não há como editar clubes;
  - histórico de partidas: `club_id` de um clube que existe, mas ainda não jogou, responde `200` com `[]`;
  - classificação: calculada a cada consulta a partir do placar gravado em `partidas`; sem clubes, `[]`.
- **Frontend:**
  - o endereço inicial (`/`) abre a lista de jogadores; a tela inicial do mockup, opcional, não foi feita;
  - uma consulta que falha por rede ou por erro do servidor é repetida uma vez;
  - recusas da API (`4xx`) e ações nunca são repetidas;
  - nenhum valor que a API devolve é recalculado nem reordenado na tela; a única conta é o custo total da
    compra (valor + taxa), que o enunciado permite;
  - depois de cada uma das 9 ações, as consultas afetadas são pedidas de novo à API (por exemplo, a venda
    atualiza jogadores, clubes, histórico e escalação), e a tela mostra os dados novos sem recarregar;
  - o botão de envio fica desabilitado do clique até a resposta, então o clique duplo envia um só pedido;
  - os formulários validam antes do envio só os obrigatórios e os limites de um campo (tamanho dos nomes,
    sigla com 3 letras maiúsculas, faixas numéricas, formação e as 5 vagas, mandante e visitante); as regras
    que cruzam campos ou dependem do banco ficam na API, e a tela mostra o `message` dela;
  - as recusas que a tela poderia prever (só livres com clube, `DOENTE` direto para `APTO`, posição de
    jogador com clube e idade menor) também vão para a API, e a tela mostra o `message`;
  - na lista de jogadores, a busca, os filtros e a ordenação valem ao clicar em Filtrar, e a página volta
    para a 1;
  - o fim da fidelidade é digitado num campo de data e hora, tratado como horário de Brasília e enviado como
    `AAAA-MM-DDTHH:MM-03:00`; as datas exibidas usam o fuso `America/Sao_Paulo`, qualquer que seja o do
    computador;
  - no histórico, o filtro por jogador lista os jogadores que aparecem no histórico do clube, e o CSV é
    baixado como a API o devolve, com o nome `historico-clube-{id}.csv`;
  - na escalação, cada vaga da formação lista só os jogadores do elenco da posição daquele setor, sem os
    `DOENTE` e sem os já escolhidos em outra vaga; a escalação salva aparece como a API a devolve;
  - o Zod, previsto no plano, não foi usado: o `@hookform/resolvers` 6 dava conflito de dependências no
    `npm install`, e o React Hook Form valida com as regras próprias dele.
