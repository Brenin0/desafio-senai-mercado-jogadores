# CLAUDE.md — backend

Leia também o `CLAUDE.md` da raiz. Regras completas em `docs/enunciado.md`; pontuação em `docs/barema.md`
(B1, B2, B3, B5).

## Stack

NestJS 11, TypeScript strict, Prisma 6, PostgreSQL 16, decimal.js, class-validator, class-transformer,
@nestjs/swagger, Jest + Supertest. Gerenciador: npm.

## Camadas (B2 conta cada violação)

```
src/
├── common/      filtro global de exceções, pipes (id da URL), middlewares (corpo, log), utilitários HTTP
├── domain/      funções puras: SEM Nest, SEM Prisma, SEM Date.now() escondido (receba "agora" por parâmetro)
├── players/     controller → service → repository
├── clubs/
├── market/      compra, venda, histórico, exportação CSV
├── league/      escalação, partidas, classificação
└── prisma/      PrismaService
```

- **Controller:** só HTTP (rota, DTO, status, cabeçalhos). Nunca calcula regra nem chama o Prisma.
- **Service:** orquestra, aplica regras de negócio chamando o domain, abre a transação.
- **Repository:** único lugar que usa o Prisma.
- **Domain:** cada cálculo existe em **um único arquivo**, reutilizado por todos que precisam:
  - `market-value.ts` (RN02–RN05), `overall.ts` e `base-value.ts` (RN06)
  - `purchase-fee.ts` (RN13: taxa e limite de 50%)
  - `loyalty-penalty.ts` (RN15: dias restantes, percentual e multa — usado pela venda **e** pela consulta do clube)
  - `sale-commission.ts` (RN16), `match-engine.ts` (RN20), `standings.ts` (RN21)
  - `money.ts` (arredondamento), `text.ts` (V4, ordem alfabética, busca sem acento), `datetime.ts` (RN01)

## Dinheiro e arredondamento

- Sempre `decimal.js`, nunca `number` em contas de moeda.
- Arredondar **uma única vez, no resultado final**, para 2 casas, meio para longe do zero
  (`Decimal.ROUND_HALF_UP`): 14,775 → 14,78; 0,385 → 0,39; 8,7875 → 8,79.
- Valor que vem de outra regra (valor base, valor de mercado) entra no cálculo seguinte já arredondado.
- Limite de 50% do caixa **sem arredondar**: caixa 261,15 → limite 130,575; custo 130,58 é recusado.
- Overall e atributo × 0,85 (MAL_CONDICIONADO na partida): inteiro, meio para cima.
- Nas respostas, moedas saem como número JSON (não string).

## Validação (V1–V9)

- `ValidationPipe` global com `whitelist: true`, `forbidNonWhitelisted: false`, `transform: true` e
  **`enableImplicitConversion: false`**. Campo desconhecido é ignorado, nunca 400.
- V1: corpo que não é objeto JSON (array, string, número) → 400; JSON malformado → 400 com `message`.
- V2: `"15"` em campo numérico → 400; `50.5` em inteiro → 400; `50.0` vale 50.
- V4: nos nomes e no `search`, trim e espaços repetidos viram um **antes** de validar o tamanho;
  caractere de controle → 400; texto que fica vazio conta como ausente.
- V5: enums exatamente como escritos (`ATA`, `MAL_CONDICIONADO`); `ata` → 400.
- V6: obrigatório ausente ou `null` → 400.
- V7: ignorar `id`, `cash`, `market_value`, `overall`, `base_value`; no cadastro e no PUT de jogador
  também `club_id` e `condition`; no PUT também atributos e potencial.
- V8: id na URL que não casa `^[1-9][0-9]*$` ou passa de 2147483647 → **404**. Jogador excluído é
  inexistente em todos os endpoints (URL, corpo e filtros).
- Query params: inteiros estritos (sem sinal, sem zero à esquerda); decimais `10`, `10.5`, `10.55`;
  parâmetro presente e vazio → 400; enum com caixa errada → 400; parâmetro desconhecido é ignorado;
  `min_age > max_age`, `min_value > max_value` e `free=true` com `club_id` → 400.
- Limites cruzados: idade ≥ 35 → agilidade ≤ 85; soma dos 6 atributos ≤ 480; potencial ≥ maior
  atributo; cadastro com idade ≥ 33 → potencial igual ao maior atributo.
- Validação sempre por mecanismo declarado (DTO, pipe, validador reutilizável), nunca `if` no controller.

## Datas (RN01)

- Entrada: só `AAAA-MM-DDTHH:MM-03:00`; data ou hora inexistente → 400 (nunca ajustar).
- Saída: `AAAA-MM-DDTHH:MM:SS-03:00`, sempre em -03:00, independente do fuso do servidor.
- Dias restantes: `ceil((fim − agora) / 1 dia)`; se ≤ 0, é 0. **Não truncar** (erro da ficha de exemplo).

## Ordem alfabética e busca

- Ordenar por nome: NFD, remover marcas Mn, minúsculas, comparar por código Unicode (não usar
  `localeCompare` nem collation do banco). Empate → id crescente.
- `search`: contém, ignorando maiúsculas e acentos.
- Ordem de posição: GOL, ZAG, LAT, MEI, ATA.

## HTTP

- Prefixo `/api/v1`. `POST /players`, `/clubs` e `/matches` → 201 com `Location: /api/v1/<recurso>/<id>`.
- `DELETE /players/{id}` → 204 sem corpo. Compra e venda → 200.
- Filtro global de exceções: toda resposta de erro é `{ "message": "<texto não vazio>" }`, com
  `Content-Type: application/json`, inclusive rota inexistente (404) e erro inesperado (500, sem stack).
- CORS só para a origem da variável `FRONTEND_ORIGIN` (nunca `*`).
- Log de cada requisição com o Logger do Nest: data e hora, método, caminho, status, numa única linha.
- Swagger em `/api/docs` com todos os endpoints.

## Banco (B3)

- 7 tabelas com nomes e colunas **exatos** da seção 3 do enunciado, via `@@map` e `@map`:
  `jogadores`, `clubes`, `contratos`, `transacoes`, `escalacoes`, `partidas`, `duelos_partida`.
- Moeda em `Decimal` com a precisão do enunciado. `escalacoes`: PK composta (`clube_id`, `jogador_id`)
  e `jogador_id` UNIQUE. `clubes.sigla` UNIQUE. `clubes.nome_normalizado` UNIQUE (espaços normalizados e
  minúsculas, **mantendo acentos**: "Águias FC" ≠ "Aguias FC").
- Proibido coluna de valor calculado (valor de mercado, overall, patrimônio, dias, % multa, pontos, posição).
- Banco nasce vazio. Seed só pelo script opcional `db:seed`.
- Mudança de schema sempre por nova migration (`npx prisma migrate dev --name <descricao>`); nunca
  editar migration já commitada.

## Transações do banco (B2)

Cada uma destas operações inteira dentro de `prisma.$transaction`:
compra (caixa, elenco, contrato, transação COMPRA); venda (caixa, jogador livre, contrato, transação
VENDA, saída da escalação); partida (partida e 6 duelos); escalação (formação e 5 titulares);
alteração de condição para DOENTE (condição e saída da escalação).

## Testes

- Unitários do domain com **todas** as tabelas de exemplo do enunciado, citando a regra no nome do teste.
- E2E com Supertest para status codes, `Location`, formato de erro e os cenários "Meia Lua" e
  "Águias FC × Delta FC" do enunciado.
- `npm test` termina sozinho (sem watch) e em menos de 10 minutos.

## Comandos

```
npm run lint          # ESLint, sem erros
npm run format:check  # Prettier, só verifica
npm test              # Jest
npm run build
npm run db:migrate    # prisma migrate deploy
npm run db:reset      # prisma migrate reset --force
```