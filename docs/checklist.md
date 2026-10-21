# Checklist do barema — Passe

Fase 0 do plano, feita em 20/10/2026 a partir da leitura integral de `CLAUDE.md`, `docs/enunciado.md`,
`docs/barema.md`, `docs/glossario.md`, `docs/ficha-avaliacao-exemplo.md` e `docs/plano.md`.
Este arquivo **não substitui** o enunciado: em divergência, valem o enunciado (requisitos) e o barema
(pontuação).

**Como usar:** marque `[x]` quando o item estiver implementado **e** coberto por teste. Cada caso-limite
vira um caso de teste que cita a regra no nome (ex.: `RN15`). "Nada gravado" quer dizer que a recusa não
altera nada; o script confere isso consultando a própria API.

## Sumário

0. [Avisos antes de começar](#0-avisos-antes-de-começar)
1. [Roteiro da API (B01 a B22)](#1-roteiro-da-api-b1-30-pontos)
2. [Roteiro da interface (F01 a F14)](#2-roteiro-da-interface-f1-30-pontos)
3. [Critérios de leitura (B2 a B5, F2 a F5), resumo](#3-critérios-de-leitura-resumo)
4. [Pontos deixados para decisão do candidato](#4-pontos-deixados-para-decisão-do-candidato)
5. [Divergências com docs/plano.md](#5-divergências-com-docsplanomd)

---

## 0. Avisos antes de começar

1. **O enunciado chegava como `docs/desafio.md`**, mas os três `CLAUDE.md` e o plano citam
   `docs/enunciado.md`. Foi renomeado na Fase 0, sem mudar o conteúdo (divergência 1, resolvida).
2. **Erratas:** as respostas às dúvidas saíram como errata até 16/10/2026 e prevalecem sobre o barema e o
   enunciado (enunciado, aviso inicial e "❓ Dúvidas"). Nenhuma errata está em `docs/`. Conferir o e-mail
   do RH e as issues de `github.com/isi-tics/desafio-isi-dev-1` antes da Fase 1.
3. **Regulamento:** o documento principal não está em `docs/`; o enunciado e o barema citam os itens 3.2,
   3.3.4, 3.4 e 5.6.4 dele.

---

## 1. Roteiro da API (B1, 30 pontos)

### Regras gerais do script (barema 3.3), valem para todos os itens

- [ ] Origem da API do README + `/api/v1`. Caminhos sem barra no final. O script não segue
      redirecionamentos: um 3xx conta como a resposta.
- [ ] Pedidos com corpo levam `Content-Type: application/json`; os demais vão sem corpo. `Accept: */*`.
- [ ] Recusa válida = código previsto + objeto JSON com `message` (texto não vazio) + nada gravado. O texto
      não é avaliado.
- [ ] Números comparados pelo valor (`40` = `40.00`), mas sempre **número JSON**, nunca texto. Campos
      extras são ignorados; os campos dos exemplos são obrigatórios.
- [ ] Cada pedido responde em até 10 s.
- [ ] Cada item vale tudo ou nada. Os dados são da banca (os exemplos do enunciado não são usados); as
      datas são calculadas a partir do momento da execução, e alguns itens esperam alguns minutos (fim de
      uma fidelidade curta).
- [ ] Nenhum pedido combina dois erros (V9): a ordem das validações é decisão nossa (D01).

**Onde está o id muda o código de erro:**

| Onde está o id | Fora do formato | Inexistente (ou jogador excluído) |
| --- | --- | --- |
| URL (`/players/{id}`, `/clubs/{id}`, `/matches/{id}`) | **404** (V8) | 404 |
| Corpo (`club_id`, `player_ids`, `home_club_id`, `away_club_id`) | 400 (0, negativo, texto, fração) | 404 |
| Query (`club_id`, `player_id`) | 400 | 404 |

Id na URL aceito: só dígitos, sem zero à esquerda, até 2.147.483.647. Viram 404: `abc`, `0`, `-1`,
`1.5`, `01`, `+1`, `2147483648`.

### Etapa 1: Jogadores (9 pontos)

#### B01 · Validação do cadastro — 1,5

**Regras:** V1 a V6; Limites de cada campo. **Endpoint:** `POST /players`.

- [ ] V1: corpo que não é objeto → 400: `[]`, `"x"`, `10`, `null`, `true`. O parser JSON do Express já
      recusa valores simples, mas deixa passar o array: o array precisa de checagem própria.
- [ ] V2: tipo errado → 400: `"agility": "15"`, `"age": 50.5`, `"pace": true`, `"name": 123`,
      `"position": 1`. `50.0` vale 50 e é aceito.
- [ ] V4 no `name`: tirar os espaços das pontas e colapsar os repetidos **antes** de validar o tamanho e
      de gravar (`"  Meia   Zeta "` volta como `"Meia Zeta"`). Tabulação, quebra de linha ou outro
      caractere de controle → 400. Nome só com espaços conta como ausente → 400.
- [ ] Tamanho em pontos de código Unicode (V4): `"é"` pré-composto conta 1.
- [ ] `name`: 3 a 100 caracteres, pelo menos 2 palavras (palavra = sequência sem espaço com pelo menos uma
      letra), nenhum dígito de 0 a 9. Aspas, `;`, hífen e apóstrofo são permitidos (o B19 usa nomes com
      `;` e aspas).
- [ ] V5: `position` com caixa diferente (`"ata"`, `"Ata"`) → 400, nunca convertido.
- [ ] V6: cada um dos 11 obrigatórios ausente ou `null` → 400: `name`, `position`, `agility`, `age`,
      `pace`, `shooting`, `passing`, `dribbling`, `defending`, `physical`, `potential`.
- [ ] Campo fora do snake_case (`Agility`, `baseValue`) é ignorado; se o obrigatório não vier → 400.
- [ ] Limites inclusivos; fora do limite → 400, nunca ajustado.
- [ ] Regras que cruzam campos, todas 400 no cadastro: idade ≥ 35 → agilidade ≤ 85; soma dos 6 atributos
      ≤ 480; `potential` ≥ maior atributo; idade ≥ 33 → `potential` igual ao maior atributo.
- [ ] Nenhuma recusa grava (o `total_items` de `GET /players` não muda).

| Entrada | Esperado |
| --- | --- |
| `name` `"A B"` (3 caracteres, 2 palavras) | 201 |
| `name` `"AB"`; `name` `"Pelé"` (1 palavra) | 400 |
| `name` com 100 / 101 caracteres | 201 / 400 |
| `name` `"Meia Lua 2"` | 400 (dígito) |
| `name` `Zé "Foguete" Lima`; `name` `Ana;Lima Souza` | 201 |
| `agility` 0 / 1 / 100 / 101 | 400 / 201 / 201 / 400 |
| `age` 15 / 16 / 45 / 46 | 400 / 201 / 201 / 400 |
| atributo ou `potential` 0 / 1 / 99 / 100 | 400 / 201 / 201 / 400 |
| soma dos 6 = 480 / 481 | 201 / 400 |
| `potential` = maior atributo / maior atributo − 1 | 201 / 400 |
| `age` 35 com `agility` 85 / 86 | 201 / 400 |
| `age` 34 com `agility` 100 | 201 |
| `age` 33 com `potential` = maior / maior + 1 | 201 / 400 |
| `age` 32 com `potential` acima do maior atributo | 201 |

#### B02 · Códigos de erro e convenções — 1

**Regras:** V1; V8; V9; Convenções da API.

- [ ] JSON malformado (`{"name": }`) → 400 com `message`.
- [ ] Caminho fora do enunciado (`GET /api/v1/coaches`) → 404 com `message`, em JSON.
- [ ] Recurso inexistente → 404 em **todas** as rotas com id: `GET /players/{id}`, `GET /clubs/{id}`,
      `GET /clubs/{id}/lineup`, `GET /clubs/{id}/transactions`, `.../export`, `GET /matches/{id}`. A ficha
      de exemplo zerou o B02 por `GET /matches/999` → 200 sem corpo.
- [ ] Id fora do formato na URL → 404, em todas as rotas com `{id}` (tabela acima).
- [ ] Regra de negócio → 409, com `message`, nada gravado.
- [ ] `Content-Type: application/json` (com ou sem `charset=utf-8`) em toda resposta JSON, inclusive
      erros e o 404 de rota. Só conferido aqui e no B19.
- [ ] Listas vazias com 200: `GET /players` →
      `{"data": [], "meta": {"page": 1, "limit": 10, "total_items": 0, "total_pages": 0}}`;
      `GET /clubs`, `GET /matches` e `GET /standings` → `[]`; histórico de clube sem transações →
      `data: []` e `summary` zerado.
- [ ] Nenhuma resposta com stack trace; o 500 também sai como `{ "message" }`.

Não conferido: método não previsto num caminho que existe (`DELETE /api/v1/clubs/1`), que pode dar 404
ou 405 (D03).

#### B03 · Campos controlados, 201 com Location e imutáveis no PUT — 1

**Regras:** V7; RN08; Convenções da API.

- [ ] `POST /players` com `id`, `base_value`, `market_value`, `overall`, `club_id`, `condition`, `cash` e
      campos inventados → 201, todos ignorados: `condition` `APTO`, `club_id` `null`, `base_value`
      calculado (RN06), `id` gerado.
- [ ] `201` com `Location: /api/v1/players/{id}` (caminho a partir da raiz ou URL absoluta).
- [ ] Resposta com os 17 campos de 2.1.2: `id`, `name`, `position`, `agility`, `age`, `condition`,
      `base_value`, `market_value`, `pace`, `shooting`, `passing`, `dribbling`, `defending`, `physical`,
      `potential`, `overall`, `club_id`.
- [ ] `GET /players/{id}` no mesmo formato.
- [ ] `PUT` com atributos, `potential`, `base_value`, `club_id` ou `condition` → 200, tudo ignorado e
      inalterado.
- [ ] `PUT` que muda posição ou idade: `overall` recalculado pela posição nova; `base_value` continua o do
      cadastro.

Casos-limite:

- `PUT` com `"pace": "abc"` ou `"potential": 0` → 200: o campo é ignorado, não validado. O DTO do `PUT`
  só pode conhecer os 4 campos editáveis.
- `PATCH /players/{id}/condition` com `name` → ignorado.

#### B04 · Edição e alteração de condição — 1

**Regras:** V1 a V6; RN08; Limites. **Endpoints:** `PUT /players/{id}`, `PATCH /players/{id}/condition`.

- [ ] `PUT` valida os 4 campos como o cadastro (`name`, `position`, `agility`, `age`), todos obrigatórios
      mesmo que só um mude; corpo que não é objeto → 400.
- [ ] Regra cruzada também no `PUT`: `age` ≥ 35 com `agility` > 85 → 400.
- [ ] `age` menor que a atual → 409; igual ou maior → 200.
- [ ] `PUT` que leva a idade a 33 ou mais é aceito, sem mexer no `potential`.
- [ ] `PATCH`: `condition` ausente, `null`, fora da lista ou em minúsculas → 400.
- [ ] `DOENTE` → `APTO` → 409. As outras transições → 200. Enviar a condição atual → 200, sem mudança.
- [ ] Resposta 200 no formato de 2.1.2, com `market_value` novo (Meia Lua: 40,00 → 37,00 ao passar a
      `MAL_CONDICIONADO`, agilidade 85, 25 anos).
- [ ] Jogador inexistente ou excluído → 404 nos dois.

Casos-limite: `DOENTE` → `MAL_CONDICIONADO` → `APTO` dá 200 e 200; `DOENTE` → `DOENTE` dá 200 sem
mudança; titular que passa a `DOENTE` sai da escalação na mesma transação (conferido no B20).

#### B05 · Valor de mercado — 2

**Regras:** RN02 a RN05.

Cálculo, nesta ordem:

1. desconto por condição: APTO 0%, MAL_CONDICIONADO 15%, DOENTE 30%; **só fora de APTO**, a agilidade
   ajusta: 80 a 100 → metade; 1 a 30 → +10 pontos; 31 a 79 → nada;
2. percentual total = ajuste por idade (até 21: +10%; 22 a 31: 0%; 32 ou mais: −10%) − desconto;
3. abaixo de −40% → −40%;
4. valor = valor base × (100 + total) ÷ 100, arredondado uma vez, meio para longe do zero;
5. abaixo de 1,00 → 1,00.

- [ ] Calculado a cada consulta e nunca gravado; o mesmo valor em toda resposta que traz jogador (lista,
      por id, cadastro, `PUT`, `PATCH`, clube, escalação).
- [ ] Entra o valor base já arredondado (RN06).
- [ ] Percentuais fracionários (7,5%, +2,5%) com decimal.js, nunca `number`.

| Valor base | Condição | Agilidade | Idade | Total | Valor de mercado |
| --- | --- | --- | --- | --- | --- |
| 82,00 | APTO | 20 | 25 | 0% (agilidade não age em APTO) | 82,00 |
| 82,00 | APTO | 50 | 19 | +10% | 90,20 |
| 82,00 | MAL_CONDICIONADO | 50 | 25 | −15% | 69,70 |
| 82,00 | MAL_CONDICIONADO | 80 | 21 | +2,5% | 84,05 |
| 82,00 | MAL_CONDICIONADO | 30 | 33 | −35% | 53,30 |
| 82,00 | DOENTE | 90 | 25 | −15% | 69,70 |
| 82,00 | DOENTE | 30 | 25 | −40% (no teto) | 49,20 |
| 82,00 | DOENTE | 10 | 40 | −50% → −40% | 49,20 |
| 9,50 | MAL_CONDICIONADO | 85 | 25 | −7,5% | 8,79 (8,7875) |
| 1,00 | MAL_CONDICIONADO | 50 | 35 | −25% | 1,00 (0,75 sobe ao piso) |
| 114,00 | APTO | 60 | 20 | +10% | 125,40 (ficha) |
| 88,00 | MAL_CONDICIONADO | 85 | 27 | −7,5% | 81,40 (ficha) |
| 46,00 | DOENTE | 20 | 34 | −50% → −40% | 27,60 (ficha) |
| 1,50 | DOENTE | 50 | 36 | −40% | 1,00 (0,90 sobe ao piso) (ficha) |
| 9,50 | MAL_CONDICIONADO | 25 | 22 | −25% | 7,13 (7,125) (ficha) |

Fronteiras para testar: agilidade 30/31 e 79/80; idade 21/22 e 31/32.

#### B06 · Indicadores, overall e valor base — 1

**Regras:** RN06.

- [ ] overall = Σ(atributo × peso da posição) ÷ 100, arredondado para inteiro com meio para cima. Como a
      soma é inteira, fazer em inteiros: (soma + 50) div 100.
- [ ] Pesos (velocidade, finalização, passe, drible, defesa, físico): GOL 10/0/20/0/40/30; ZAG
      10/0/15/0/45/30; LAT 25/0/20/15/25/15; MEI 10/15/35/25/5/10; ATA 20/40/10/20/0/10.
- [ ] overall recalculado a cada consulta pela posição atual; nunca gravado.
- [ ] valor base calculado **uma vez**, no cadastro, com o overall e a idade do cadastro, e gravado: 0,50
      por ponto de 41 a 60 + 2,00 por ponto de 61 a 75 + 6,00 por ponto de 76 a 99 (até 40 não soma);
      idade no cadastro ≤ 21 → × (100 + potencial − overall) ÷ 100; arredonda uma vez; piso 1,00.
- [ ] Atributos e `potential` nunca mudam depois do cadastro e não entram no valor de mercado.

Overall:

| Posição | Atributos (pace, shooting, passing, dribbling, defending, physical) | Soma ÷ 100 | Overall |
| --- | --- | --- | --- |
| MEI | 68, 65, 80, 78, 52, 60 | 72,65 | 73 |
| ATA | 78, 75, 73, 82, 48, 68 | 76,10 | 76 |
| LAT | 72, 70, 78, 76, 70, 66 | 72,40 | 72 |
| ZAG | 50, 90, 60, 40, 80, 75 | 72,50 | 73 (meio para cima) |
| GOL | 55, 30, 65, 40, 72, 68 | 67,70 | 68 |
| ZAG | 60, 30, 55, 40, 81, 77 | 73,80 | 74 (ficha) |
| ATA | 80, 77, 60, 74, 30, 70 | 74,60 | 75 (ficha) |
| LAT | 60, 40, 60, 60, 62, 60 | 60,50 | 61 (ficha) |

Valor base:

| Overall | Potencial | Idade no cadastro | Valor base |
| --- | --- | --- | --- |
| 75 | 86 | 25 | 40,00 |
| 60 | 70 | 30 | 10,00 (fim da 1ª faixa) |
| 61 | 70 | 30 | 12,00 (início da 2ª faixa) |
| 76 | 80 | 22 | 46,00 |
| 85 | 92 | 27 | 100,00 |
| 70 | 84 | 21 | 34,20 (30,00 × 1,14) |
| 70 | 84 | 22 | 30,00 (22 anos não é jovem promessa) |
| 45 | 90 | 18 | 3,63 (3,625) |
| 40 | 66 | 36 | 1,00 (0,00 sobe ao piso) |
| 85 | 99 | 20 | 114,00 (ficha) |
| 83 | 88 | 27 | 88,00 (ficha) |
| 43 | 55 | 36 | 1,50 (ficha) |

Fronteiras: overall 41 → 0,50 → 1,00 (piso); 42 → 1,00; 75 → 40,00; 99 → 184,00.

#### B07 · Listagem — 1

**Regras:** RN07; Filtros e query params. **Endpoint:** `GET /players`.

- [ ] Resposta `{ data, meta: { page, limit, total_items, total_pages } }`; padrões `page=1`, `limit=10`,
      `sort=name`.
- [ ] Ordem: busca → filtros → ordenação → paginação. `total_items` conta todos os que atendem;
      `total_pages` = teto(total ÷ limit), 0 sem itens; página além da última → 200, `data: []`, `meta`
      correto.
- [ ] `search`: V4, 2 a 100 caracteres, "contém", sem diferenciar caixa nem acento (NFD + tirar marcas Mn;
      "ç" vale "c"): `joao` acha "João Silva", `LUA` acha "Meia Lua".
- [ ] `position` e `condition`: valor exato da lista.
- [ ] `free=true` só livres; `free=false` só com clube; `club_id` só o elenco do clube (inexistente →
      404).
- [ ] `min_age`/`max_age` de 16 a 45; `min_value`/`max_value` de 0 a 550 pelo **valor de mercado**, nunca
      pelo valor base; faixas inclusivas; vindo um limite só, o outro é o extremo da faixa.
- [ ] `sort`: `name`, `value_asc`, `value_desc`, `age_asc`, `age_desc`, `position` (GOL, ZAG, LAT, MEI,
      ATA); até dois, separados por vírgula, sem espaço e sem repetir o campo; o segundo desempata o
      primeiro; depois sempre nome (ordem alfabética das Premissas) e id crescente.
- [ ] Jogador excluído nunca aparece.
- [ ] Parâmetro com nome desconhecido é ignorado; parâmetro presente e vazio (`position=`) → 400.

Recusas (400):

- `search=`, `search=a`, `search=%20%20`, `search` com 101 caracteres ou com tabulação;
- `position=mei`, `condition=apto`, `free=TRUE`, `free=1`, `sort=POSITION`;
- `page=0`, `page=01`, `page=1.0`, `page=+1`, `page=1e1`, `limit=0`, `limit=51`;
- `min_age=15`, `max_age=46`, `min_age=30&max_age=20`;
- `min_value=-1`, `00.5`, `.5`, `10,5`, `10.555`, `1e2`, `550.01`, `min_value=20&max_value=10`;
- `free=true&club_id=1` (combinação contraditória); `club_id=abc` (400, não 404: é query);
- `sort=name,`, `sort=name, age_asc`, `sort=value_asc,value_desc`, `sort=name,name`,
  `sort=name,age_asc,position`.

Aceitos: `min_value=0`, `0.5`, `10.50`, `max_value=550`, `min_age=20&max_age=20`,
`free=false&club_id=1`, `sort=position,value_desc`, `sort=value_desc,name`.

Ordem alfabética: "Épsilon" fica entre "Delta" e "Gama"; "Ana Lima" vem antes de "Ana-Maria" (espaço <
hífen < letras); "Águias FC" e "Aguias FC" empatam e o id desempata.

Tabela da paginação: 23 itens, `limit=10`: página 1 → 10 itens, página 3 → 3, página 4 → 0, sempre com
`total_items` 23 e `total_pages` 3; `limit=50` → 23 itens e 1 página; 0 itens → 0 e 0.

#### B08 · Exclusão lógica — 0,5

**Regras:** RN09; V8. **Endpoint:** `DELETE /players/{id}`.

- [ ] Jogador livre → 204, sem corpo; grava `excluido_em`; nada é apagado.
- [ ] Depois: `GET`, `PUT`, `PATCH /condition` e novo `DELETE` → 404; o jogador sai de `GET /players` e do
      `total_items`.
- [ ] Também 404 na compra (B11), na venda (B16), na escalação (B20) e no filtro `player_id` (B18).
- [ ] Jogador com clube → 409 (conferido no B17).
- [ ] Transações, contratos e duelos antigos continuam como foram gravados.

### Etapa 2: Clubes (1,5 ponto)

#### B09 · Clubes — 1,5

**Regras:** RN10; RN11; Limites. **Endpoints:** `POST /clubs`, `GET /clubs`.

- [ ] 201 com `Location: /api/v1/clubs/{id}`; corpo com `id`, `name`, `acronym`, `cash` 300.00,
      `squad_value` 0.00 e `net_worth` 300.00.
- [ ] `name`: V4; 3 a 60 caracteres; 2 a 5 palavras; só letras (categoria Unicode L, com ou sem acento),
      espaço, hífen e ponto → senão 400.
- [ ] Nome único depois da V4, sem diferenciar maiúsculas **mas considerando acentos** → 409; garantido
      também no banco (B3).
- [ ] `acronym`: exatamente 3 letras A–Z maiúsculas e sem acento; não todas iguais; a primeira é a
      primeira letra do nome; as três aparecem no nome nessa ordem, comparando sem caixa e sem acento →
      senão 400. Sigla já cadastrada → 409.
- [ ] 21º clube → 409.
- [ ] `GET /clubs`: array com os campos mínimos, sem elenco, pelo nome (ordem alfabética, empate pelo id).
- [ ] `cash` enviado no corpo é ignorado (V7).

Com "Águias FC" já cadastrado:

| Entrada | Esperado |
| --- | --- |
| nome `"  águias   fc "` | 409 |
| nome `"Aguias FC"`, sigla nova | 201 |
| sigla `AGU`, `AFC` ou `ASC` para "Águias FC" | válida |
| sigla `GFC` (não começa pela 1ª letra), `ACF` (fora de ordem), `agu`, `ÁGU`, `AG`, `AGUA` | 400 |
| sigla `AAA` para "Arara Azul Atlético" | 400 (três letras iguais) |
| nome `"FC"`; `"Flamengo"` (1 palavra); 6 palavras | 400 |
| nome `"F.C. Recife"`; `"Santa-Cruz Recife"` | 201 |
| nome `"Clube 1 FC"`; com `&`; `"D'Ávila FC"` (apóstrofo) | 400 |
| nome com 60 / 61 caracteres | 201 / 400 |

### Etapa 3: Compra (5 pontos)

#### B10 · Compra — 1,5

**Regras:** RN12; RN13. **Endpoint:** `POST /players/{id}/buy` com `{ "club_id", "loyalty_until" }`.

- [ ] 200 com `id`, `club_id`, `player_id`, `player_name`, `type` `COMPRA`, `value`, `fee`, `penalty`
      0.00, `profit` `null`, `cash_change` = −(value + fee), `created_at`,
      `contract { purchase_value, loyalty_until, status: "ATIVO" }` e `club_cash`.
- [ ] Preço = valor de mercado do momento, nunca o valor base.
- [ ] Taxa = 5% do valor, arredondada, só quando o valor é **maior** que 30,00.
- [ ] Custo total = valor + taxa ≤ caixa ÷ 2, **sem arredondar o limite**; acima → 409, nada gravado.
- [ ] Numa transação: caixa − custo; jogador no elenco; contrato `ATIVO` (valor de compra sem a taxa, fim
      da fidelidade, início); transação `COMPRA` com o nome do momento.

| Caixa antes | Valor | Taxa | Custo | Limite | Resultado |
| --- | --- | --- | --- | --- | --- |
| 300,00 | 28,00 | 0,00 | 28,00 | 150,00 | aceita |
| 300,00 | 30,00 | 0,00 (não é maior que 30) | 30,00 | 150,00 | aceita |
| 300,00 | 30,01 | 1,50 (1,5005) | 31,51 | 150,00 | aceita |
| 100,00 | 47,62 | 2,38 | 50,00 | 50,00 | aceita (igual ao limite) |
| 100,00 | 48,00 | 2,40 | 50,40 | 50,00 | 409 |
| 261,15 | — | — | 130,58 | 130,575 | 409 |
| 189,41 | 90,20 | 4,51 | 94,71 | 94,705 | 409 (ficha) |
| 189,41 | 90,19 | 4,51 | 94,70 | 94,705 | aceita; caixa 94,71 (ficha) |

#### B11 · Compra recusada — 1

**Regras:** RN09; RN12; RN14; V8; Limites.

- [ ] Jogador com clube → 409.
- [ ] Jogador da URL excluído ou inexistente → 404.
- [ ] Elenco com 12 jogadores: a 13ª compra → 409.
- [ ] `club_id` ausente, `null`, `0`, `-1`, `"1"` ou `1.5` → 400.
- [ ] `club_id` inexistente → 404.
- [ ] Nenhuma recusa grava (caixa, elenco, contrato, transação).

#### B12 · Fim da fidelidade — 1

**Regras:** RN01; Limites.

- [ ] Entrada só no formato `AAAA-MM-DDTHH:MM-03:00`; a resposta traz `AAAA-MM-DDTHH:MM:SS-03:00`.
- [ ] Data ou hora inexistente → 400, nunca ajustada.
- [ ] Depois do momento da compra e até 1.095 dias depois dele → fora disso 400 (não 409).
- [ ] Nada depende do fuso da máquina (a API em contêiner pode estar em UTC).

Recusas (400): `2027-03-02T10:15` (sem fuso); com `Z`, `+00:00`, `-02:00` ou `-0300`;
`2027-03-02T10:15:00-03:00` (com segundos: é o formato de saída, não o de entrada); espaço no lugar do
`T`; `t` minúsculo; `2027-3-2T10:15-03:00`; `2027-02-30`; `2027-02-29` (2027 não é bissexto); `T24:00`;
`T23:60`; mês 13; dia 00; número em vez de texto; data passada; o minuto atual (já passou); agora + 1.095
dias + 1 minuto.

Aceitos: `2028-02-29T10:00-03:00` (bissexto); `T00:00`; agora + 1.095 dias, no minuto truncado.

#### B13 · Sequência de compras e consulta do clube — 1,5

**Regras:** RN02 a RN05; RN11; RN13; RN15. **Endpoint:** `GET /clubs/{id}`.

- [ ] Cada compra com valor, taxa, custo e caixa corretos (o limite usa o caixa do momento).
- [ ] `GET /clubs/{id}`: `cash`, `squad_value` (soma dos valores de mercado atuais), `net_worth` = cash +
      squad_value e `players`.
- [ ] Elenco por posição GOL, ZAG, LAT, MEI, ATA; depois nome (ordem alfabética); depois id.
- [ ] Cada jogador com os campos de 2.1.2 e
      `contract { purchase_value, loyalty_until, remaining_days, penalty_rate }`.
- [ ] `remaining_days` e `penalty_rate` calculados no momento da consulta pela **mesma função** da venda
      (a ficha perdeu o B14 por ter duas).

Casos: exemplo 2.2.2 (compra em 02/11/2026 10:15, fidelidade 02/03/2027 10:15 → 120 dias, 10%); ficha:
caixa 300,00 → 214,53 → 186,93 → 138,63 → 137,63; elenco 156,00; patrimônio 293,63; contratos 366/20%,
61/10%, 17/5% e 0/0% (fidelidade que venceu um minuto antes).

### Etapa 4: Venda (5 pontos)

#### B14 · Multa por fidelidade — 2

**Regras:** RN15.

- [ ] Dias restantes = teto((fim da fidelidade − momento da venda) ÷ 1 dia), com a fração; se o fim já
      passou ou é o próprio momento → 0. **Arredondar para cima, nunca truncar** (erro da ficha).
- [ ] Faixas: 0 → 0%; 1 a 30 → 5%; 31 a 180 → 10%; 181 ou mais → 20%.
- [ ] Multa = valor de mercado na venda × percentual, arredondada, com teto de 10,00.
- [ ] Com multa → contrato `RESCINDIDO`; sem multa → `ENCERRADO`; grava o fim do contrato.
- [ ] Resposta da venda com `purchase_value`, `remaining_days`, `penalty_rate`, `contract_status` e
      `club_cash`, além dos campos da transação.

| Fim da fidelidade, a partir da venda | Dias | Multa |
| --- | --- | --- |
| já passou | 0 | 0%, `ENCERRADO` |
| 10 dias e 2 horas | 11 | 5% |
| exatamente 30 dias | 30 | 5% |
| 30 dias e 1 minuto | 31 | 10% |
| 30 dias, 6 h, 1 min e 29 s | 31 | 10% (ficha: a API deu 30 e 5%) |
| exatamente 180 dias | 180 | 10% |
| 180 dias e 1 minuto | 181 | 20% |
| 199 dias e 23 h 57 min | 200 | 20% (ficha) |
| 116 dias, 17 h e 35 min | 117 | 10% (Meia Lua) |

Teto: 20% × 76,00 = 15,20 → 10,00; 10% × 120,00 = 12,00 → 10,00.

#### B15 · Venda — 2

**Regras:** RN16. **Endpoint:** `POST /players/{id}/sell`, sem corpo.

- [ ] Valor de compra = valor gravado no contrato `ATIVO` (sem a taxa).
- [ ] Lucro = valor de mercado na venda − valor de compra; pode ser zero ou negativo.
- [ ] Comissão = 0,00 se lucro ≤ 0; senão 10% da parte até 10,00 + 20% da parte acima, arredondada uma
      vez, no final.
- [ ] Crédito = valor − multa − comissão; caixa + crédito.
- [ ] Na mesma transação: jogador livre (`club_id` nulo, volta a `free=true`), contrato fechado,
      transação `VENDA` (`fee` = comissão, `penalty`, `profit`, `cash_change` = crédito) e saída da
      escalação.

| Lucro | Comissão |
| --- | --- |
| 3,00 | 0,30 |
| 3,85 | 0,39 (0,385) |
| 10,00 | 1,00 |
| 10,01 | 1,00 (1,002) |
| 15,00 | 2,00 |
| −7,50 | 0,00 |

| Compra | Venda | Multa | Lucro | Comissão | Crédito |
| --- | --- | --- | --- | --- | --- |
| 37,00 | 40,00 | 10% = 4,00 | 3,00 | 0,30 | 35,70 |
| 50,00 | 42,50 | 20% = 8,50 | −7,50 | 0,00 | 34,00 |
| 26,15 | 30,00 | 5% = 1,50 | 3,85 | 0,39 | 28,11 |
| 25,00 | 25,00 | 0% | 0,00 | 0,00 | 25,00 |
| 60,00 | 75,00 | 20% = 15,00 → 10,00 | 15,00 | 2,00 | 63,00 |

Meia Lua completo: caixa 261,15 + 35,70 = 296,85; contrato `RESCINDIDO`.

#### B16 · Venda recusada e recompra — 1

**Regras:** RN12; RN16; V8.

- [ ] Vender jogador livre → 409; jogador excluído ou inexistente → 404.
- [ ] O clube que vendeu o jogador não compra de novo → 409; outro clube compra → 200.

Sequência: A compra X e vende; A tenta comprar → 409; B compra → 200; B vende; A tenta de novo → 409 e B
também → 409 (vale qualquer venda passada daquele clube).

### Etapa 5: Clubes com elenco (1 ponto)

#### B17 · Patrimônio, filtros de clube e 409 — 1

**Regras:** RN07; RN09; RN11; Filtros e query params; Limites.

- [ ] `GET /clubs?sort=net_worth_desc` e `net_worth_asc`, empate pelo nome e depois pelo id.
- [ ] `sort` inválido → 400: `NET_WORTH_DESC`, `net_worth`, `name,net_worth_desc` (aceita um só valor),
      `sort=`.
- [ ] `GET /players?club_id=X` só o elenco; `free=false` só quem tem clube; `free=false&club_id=X`
      aceito.
- [ ] `DELETE` de jogador com clube → 409.
- [ ] `PUT` que muda a posição de jogador com clube → 409; a mesma posição → 200.

### Etapa 6: Histórico e exportação (4 pontos)

#### B18 · Histórico — 2

**Regras:** RN09; RN17; Filtros e query params. **Endpoint:** `GET /clubs/{id}/transactions`.

- [ ] Resposta `{ data, summary }`; cada transação com `id`, `club_id`, `player_id`, `player_name`,
      `type`, `value`, `fee`, `penalty`, `profit` (nulo na compra), `cash_change` e `created_at`.
- [ ] Ordem: `created_at` decrescente; empate → id decrescente.
- [ ] Nome e valores do momento: renomear o jogador ou mudar a condição depois não muda a transação.
- [ ] Transações de jogador excluído continuam no histórico.
- [ ] Conciliação: 300,00 + Σ `cash_change` = caixa atual.
- [ ] `type`: `COMPRA`, `VENDA`, `COMPRA,VENDA` ou `VENDA,COMPRA`. Recusas (400): `compra`,
      `COMPRA,venda`, `COMPRA,COMPRA`, `COMPRA,`, `COMPRA, VENDA`, `type=`.
- [ ] `player_id`: fora do formato → 400; inexistente ou **excluído** → 404; jogador sem transações no
      clube → 200, `data: []`, `summary` zerado.
- [ ] Clube inexistente → 404.
- [ ] `summary` sobre as transações filtradas, com 2 casas: `total_spent` = Σ(value + fee) das COMPRA;
      `total_received` = Σ `cash_change` das VENDA; `total_fees` = Σ `fee` de todas; `total_penalties` =
      Σ `penalty` das VENDA; `total_profit` = Σ `profit` das VENDA, com sinal. Sem transações, tudo 0,00.

Casos: Meia Lua sem filtro → 38,85 / 35,70 / 2,15 / 4,00 / 3,00; com `type=VENDA` → 0,00 / 35,70 / 0,30
/ 4,00 / 3,00. Ficha: 300,00 + (−67,20 − 79,80 − 20,00 + 20,00 + 60,80 + 66,00) = 279,80.

#### B19 · Exportação CSV — 2

**Regras:** RN18. **Endpoint:** `GET /clubs/{id}/transactions/export`.

- [ ] 200 com `Content-Type: text/csv` (charset opcional); o cabeçalho é conferido.
- [ ] UTF-8 **sem BOM**; cada linha termina em `\n` (LF), inclusive a última; nunca `\r\n`.
- [ ] Primeira linha exatamente:
      `data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa`.
- [ ] Linhas na mesma ordem do histórico.
- [ ] `data_hora` no formato de saída da RN01; valores com 2 casas e vírgula decimal, sem separador de
      milhar; negativo com `-`; `lucro` vazio quando nulo.
- [ ] `jogador` = nome gravado na transação; com `;` ou aspas, vai entre aspas duplas e cada aspa interna
      é duplicada (`"Zé ""Foguete"" Lima"`); sem esses caracteres, vai sem aspas.
- [ ] Mesmos filtros e validações do histórico; os erros 400 e 404 saem em JSON.
- [ ] Sem transações, inclusive depois do filtro: **só a linha de cabeçalho**, com o `\n` (a ficha zerou o
      B19 com um arquivo de 0 bytes).

```text
data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa
2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70
2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85
```

### Etapa 7: Liga (4,5 pontos)

#### B20 · Escalação — 1,5

**Regras:** RN19; V8; V9; Limites. **Endpoints:** `PUT /clubs/{id}/lineup`, `GET /clubs/{id}/lineup`.

- [ ] `PUT` com `{ formation, player_ids }` → 200 com `{ club_id, formation, complete, players }`.
- [ ] 400: `formation` ausente, `null` ou fora de `3-1`, `2-2`, `2-1-1`, `1-2-1`; `player_ids` ausente,
      que não é lista, com tamanho diferente de 5, com ids repetidos ou que não são inteiros positivos
      (`0`, `-1`, `"3"`, `1.5`).
- [ ] 404: clube da URL inexistente ou fora do formato; jogador inexistente ou excluído.
- [ ] 409, sem gravar nada (a escalação anterior continua): jogador de outro clube ou livre; jogador
      `DOENTE`; posições que não fecham a formação.
- [ ] Exatamente 1 GOL e, por setor: `3-1` = 3 de defesa (ZAG ou LAT), 0 MEI, 1 ATA; `2-2` = 2 de defesa,
      0 MEI, 2 ATA; `2-1-1` = 2, 1, 1; `1-2-1` = 1, 2, 1. Nas formações de dois números, o segundo é o
      **ataque**, não o meio.
- [ ] `MAL_CONDICIONADO` pode ser escalado.
- [ ] Substitui a escalação inteira numa transação (formação e 5 titulares); não muda o caixa.
- [ ] Titular vendido ou que passa a `DOENTE` sai da escalação na mesma transação; `formation` continua a
      salva, `complete` vira `false` e o jogador não volta sozinho.
- [ ] `GET`: `players` na ordem do elenco (RN11), cada um com os campos de `GET /players/{id}`; sem
      escalação → `{ club_id, formation: null, complete: false, players: [] }`; clube inexistente → 404.

Casos: exemplo 2.4.1 (`player_ids` `[34, 31, 30, 33, 32]` volta na ordem GOL, ZAG, LAT, MEI, ATA); dois
GOL → 409; nenhum GOL → 409; `2-1-1` com dois MEI → 409; titular `DOENTE` que passa a
`MAL_CONDICIONADO` continua fora.

#### B21 · Partida — 2

**Regras:** RN20; V8; V9. **Endpoint:** `POST /matches` com `{ home_club_id, away_club_id }`.

- [ ] Conferências nesta ordem (diagrama do enunciado): 400 (corpo, ids, mandante igual ao visitante) →
      404 (clube inexistente) → 409 (escalação incompleta em qualquer um dos dois).
- [ ] 201 com `Location: /api/v1/matches/{id}`.
- [ ] Resposta: `id`, `played_at`, `home { club_id, club_name, formation, goals }`, `away { ... }`,
      `result` e `duels` (6), cada um com `order`, `attacking_club_id`,
      `attacker { player_id, player_name, position, condition, attribute, value }`, `defender { ... }` e
      `goal`.
- [ ] Titulares na ordem do elenco: o goleiro e os 4 de linha numerados do 1º (mais recuado) ao 4º; na
      mesma posição, nome e depois id.
- [ ] Duelos: 1 = 4º do mandante × goleiro do visitante; 2 = 3º × 1º; 3 = 2º × 2º; 4 a 6, o mesmo com o
      visitante atacando.
- [ ] Ataque pela posição do atacante: ATA `shooting`, MEI `passing`, ZAG e LAT `dribbling`; a defesa usa
      sempre `defending`, inclusive o goleiro.
- [ ] `MAL_CONDICIONADO`: cada atributo × 0,85, inteiro com meio para cima, em inteiros: (x × 85 + 50) div
      100. Vale para atacante e defensor e não altera o jogador.
- [ ] Gol só se ataque **maior** que defesa (empate não é gol); `result` `MANDANTE`, `VISITANTE` ou
      `EMPATE`.
- [ ] Numa transação: partida (`jogada_em`, placar, formações) e os 6 duelos com nome, posição, condição,
      atributos e valores do momento.
- [ ] Não muda caixa, escalação nem jogadores; o mesmo confronto pode se repetir.
- [ ] 400: ids ausentes, `null`, texto, fração, 0, negativos ou iguais. 404: clube inexistente. 409: clube
      que nunca escalou ou que perdeu titular e não escalou de novo.

Águias FC (mandante) × Delta FC, os dois no `2-1-1`, LAT do Águias `MAL_CONDICIONADO`:

| Duelo | Atacante | Ataque | Defensor | Defesa | Gol |
| --- | --- | --- | --- | --- | --- |
| 1 | Otto Rangel (ATA, 4º Águias) | finalização 75 | Ivo Teles (GOL Delta) | 72 | sim |
| 2 | Lauro Neves (MEI, 3º) | passe 82 | Hugo Vaz (ZAG, 1º Delta) | 84 | não |
| 3 | Davi Lins (LAT, 2º, mal cond.) | drible 74 → 63 | Lino Matos (LAT, 2º Delta) | 63 | não (empate) |
| 4 | Ugo Falcão (ATA, 4º Delta) | finalização 81 | Rui Prado (GOL Águias) | 77 | sim |
| 5 | Nei Soares (MEI, 3º) | passe 70 | Téo Brandão (ZAG, 1º Águias) | 84 | não |
| 6 | Lino Matos (LAT, 2º) | drible 79 | Davi Lins (mal cond.) | 66 → 56 | sim |

Placar 1 × 2, `result` `VISITANTE`. Arredondamentos: 74 → 63 (62,9); 66 → 56 (56,1); 50 → 43 (42,5). No
`1-2-1`, o MEI que vem antes pelo nome é o 2º de linha (ataca no duelo 3 ou 6) e o outro é o 3º (duelo 2
ou 5).

#### B22 · Histórico de partidas e classificação — 1

**Regras:** RN21; Filtros e query params. **Endpoints:** `GET /matches`, `GET /matches/{id}`,
`GET /standings`.

- [ ] `GET /matches`: array (sem `duels`), `played_at` decrescente, empate → id decrescente, com placar e
      `result`.
- [ ] `club_id`: partidas em que o clube foi mandante ou visitante; fora do formato → 400; inexistente →
      404; sem partidas → `[]`.
- [ ] `GET /matches/{id}`: formato de 2.4.2 com os 6 duelos na ordem; inexistente → 404.
- [ ] `GET /standings`: **todos** os clubes, inclusive os que não jogaram (zerados), com `position`,
      `club_id`, `club_name`, `played`, `wins`, `draws`, `losses`, `goals_for`, `goals_against`,
      `goal_difference`, `points` (vitória 3, empate 1).
- [ ] Ordem: pontos, saldo, gols marcados (todos decrescentes), nome (ordem alfabética) e id; `position`
      de 1 ao total, sem repetir.
- [ ] Calculada a cada consulta; sem clubes → `[]`.

Exemplo de 6 clubes (Águias 1 × 2 Delta, Gama 2 × 1 Épsilon, Épsilon 3 × 2 Águias, Delta 0 × 1 Gama):
1 Gama SC 6 pts, +2, 3 gols; 2 Épsilon EC 3, 0, 4; 3 Delta FC 3, 0, 2; 4 Mangue FC 0, 0, 0; 5 Tubarões
EC 0, 0, 0; 6 Águias FC 0, −2, 3.

---

## 2. Roteiro da interface (F1, 30 pontos)

### Regras gerais (barema 3.4)

- [ ] Chrome em janela de 1366 × 768; banco recriado e carga inicial feita pela API.
- [ ] O item vale zero se a tela não envia o pedido previsto, não mostra a resposta recebida ou não trata
      o código. Por isso **filtro, ordenação e paginação sempre pela API** (query params): nada filtrado nem
      ordenado no navegador.
- [ ] Valor errado vindo da API não tira ponto da tela (já foi avaliado no B1).
- [ ] Cada ação mostra o resultado em até 10 s.
- [ ] Botões e textos reconhecidos pelo sentido ("Excluir" ou "Remover").
- [ ] Vídeo e HAR gravados: a tela mostra o que a API respondeu, na ordem em que respondeu.

### Etapa 1: Jogadores (7 pontos)

#### F01 · Tabela e paginação — 2

**Pedido:** `GET /players?page=N&limit=10`.

- [ ] Colunas: nome, posição, overall, agilidade, idade, condição, valor base, valor de mercado e clube
      (nome ou sigla; "Livre" quando `club_id` é nulo).
- [ ] 10 por página, navegação entre páginas pelo `meta.total_pages` e total encontrado pelo
      `meta.total_items`.
- [ ] Valores como a API devolve, moeda com 2 casas e vírgula.

Casos-limite: última página com menos de 10; banco vazio → estado de lista vazia; "próxima" desabilitada
na última página.

#### F02 · Busca, filtros e ordenação — 2

**Pedido:** `GET /players` com `search`, `position`, `condition`, `free=true`, `club_id`,
`min_age`/`max_age`, `min_value`/`max_value` e `sort`.

- [ ] Busca por nome; filtros por posição, condição, só livres, faixa de idade e faixa de valor de
      mercado, combináveis no mesmo pedido.
- [ ] Ordenação por nome (`name`), valor nos dois sentidos (`value_asc`, `value_desc`), idade nos dois
      sentidos (`age_asc`, `age_desc`) e posição (`position`).
- [ ] "Só livres" junto com clube: a tela impede a combinação (DF4) ou mostra o `message` do 400.

Casos-limite: mudar filtro ou ordenação volta à página 1; busca com 1 caractere (DF6); vírgula no filtro
de valor (DF7); o filtro por clube também precisa existir (o F06 usa).

#### F03 · Excluir — 1

**Pedido:** `DELETE /players/{id}`.

- [ ] Botão Excluir só nos jogadores livres.
- [ ] Confirmação antes de enviar.
- [ ] Depois do 204, a lista é buscada de novo e o jogador some, sem recarregar a página.

Casos-limite: excluir o único jogador da última página → voltar uma página; clique duplo = 1 pedido.

#### F04 · Cadastro, edição e condição — 2

**Pedidos:** `POST /players`, `PUT /players/{id}`, `PATCH /players/{id}/condition`.

- [ ] Cadastro com nome, posição, agilidade, idade e os 7 indicadores informados (6 atributos e
      potencial).
- [ ] Depois de salvar, valor base e overall aparecem, vindos da API.
- [ ] Edição de nome, posição, agilidade e idade, com o formulário preenchido e os 4 campos enviados.
- [ ] Alteração de condição; a tabela mostra o novo valor de mercado devolvido.

Casos-limite: regras que cruzam campos (soma acima de 480, potencial abaixo do maior atributo) ficam na
API, e a tela mostra o `message`; `DOENTE` → `APTO` (DF5).

### Etapa 2: Clubes (2 pontos)

#### F05 · Clubes — 2

**Pedidos:** `GET /clubs` (padrão: nome), `POST /clubs`.

- [ ] Colunas: nome, sigla, caixa, valor do elenco e patrimônio.
- [ ] Ordenada por nome, na ordem devolvida pela API (sem ordenar na tela).
- [ ] Formulário de criação (nome e sigla); a lista atualiza depois de criar.
- [ ] Nome ou sigla repetidos e 21º clube: a tela envia e mostra o `message`.

### Etapa 3: Compra e venda (8 pontos)

#### F06 · Compra — 3

**Pedidos:** `POST /players/{id}/buy`; depois `GET /players` com `club_id` e com `free=true`.

- [ ] Ação Comprar a partir da lista de jogadores livres.
- [ ] Escolha do clube entre **todos** (sem conferir caixa, elenco ou recompra na tela).
- [ ] Fim da fidelidade digitado em data e hora de Brasília e enviado como `AAAA-MM-DDTHH:MM-03:00`.
- [ ] Confirmação antes do envio.
- [ ] Resultado: valor, taxa, custo total (valor + taxa, a única soma permitida), fim da fidelidade e novo
      caixa (`club_cash`).
- [ ] Depois: a tabela mostra o clube do jogador; o filtro por clube o encontra; "só livres" deixa de
      mostrá-lo.

Casos-limite: acrescentar `-03:00` ao texto do campo de data e hora, sem `toISOString()` (que gera `Z` e
dá 400); 409 de limite de caixa, elenco cheio ou recompra → `message`; clique duplo = 1 compra.

#### F07 · Página do clube e ranking por patrimônio — 2

**Pedidos:** `GET /clubs/{id}`, `GET /clubs?sort=net_worth_desc`.

- [ ] Caixa, valor do elenco e patrimônio.
- [ ] Elenco na ordem da API, com o valor de mercado e as colunas do contrato: fim da fidelidade, dias
      restantes e % de multa.
- [ ] Lista de clubes ordenável por patrimônio, do maior para o menor, na ordem da API.

#### F08 · Venda — 3

**Pedido:** `POST /players/{id}/sell`.

- [ ] Botão Vender em cada jogador do elenco, com confirmação antes do envio.
- [ ] Resultado: valor de compra, valor de venda, dias restantes, multa, lucro (com sinal), comissão,
      crédito e novo caixa.
- [ ] Depois: elenco, resumo do clube, histórico e escalação atualizados.

### Etapa 4: Histórico (6 pontos)

#### F09 · Histórico de transações — 3

**Pedido:** `GET /clubs/{id}/transactions?type=...&player_id=...`.

- [ ] Colunas: data e hora (Brasília), tipo, jogador, valor, taxa ou comissão, multa, lucro e variação do
      caixa com sinal ("+" entrada, "-" saída).
- [ ] Filtro por um ou mais tipos (`COMPRA`, `VENDA` ou `COMPRA,VENDA`) e por jogador.
- [ ] Jogador escolhido entre os que aparecem no histórico do clube (DF15).
- [ ] Filtro recusado pela API (jogador excluído → 404) → a tela mostra o `message`.

Casos-limite: lucro nulo na compra; ordem da API.

#### F10 · Totais do summary — 2

- [ ] Abaixo da tabela, os 5 totais do `summary` da mesma resposta: total pago em compras, total recebido
      em vendas, total de taxas e comissões, total de multas e lucro total (com sinal).
- [ ] Mudam com o filtro; nunca somados na tela.

#### F11 · Exportar CSV — 1

**Pedido:** `GET /clubs/{id}/transactions/export` com os mesmos `type` e `player_id` da tabela.

- [ ] Botão Exportar CSV baixa o arquivo devolvido pela API.
- [ ] Erro (400 ou 404, em JSON) vira aviso com o `message`.

### Etapa 5: Liga (7 pontos)

#### F12 · Escalação — 2

**Pedidos:** `GET /clubs/{id}/lineup`, `PUT /clubs/{id}/lineup`.

- [ ] Aba Escalação na página do clube.
- [ ] Escolha da formação (`3-1`, `2-2`, `2-1-1`, `1-2-1`) e de um titular para cada vaga (1 goleiro e os
      jogadores de linha de cada setor), entre os jogadores do elenco, sem `DOENTE`.
- [ ] Depois de salvar, a tela mostra a escalação devolvida pela API.
- [ ] Escalação incompleta (`complete: false`) → aviso de que o clube não pode jogar.

Casos-limite: depois de vender um titular ou passá-lo a `DOENTE`, a aba mostra a escalação incompleta e o
aviso; o formulário não envia sem a formação e as 5 vagas preenchidas (F2: a ficha perdeu ponto aqui).

#### F13 · Partida — 3

**Pedido:** `POST /matches`.

- [ ] Escolha do mandante e do visitante.
- [ ] Resultado com o placar e os 6 duelos da resposta (atacante, defensor, atributos, valores e gol), sem
      recalcular. A ficha zerou o F13 por mostrar só o placar.
- [ ] Clube sem escalação completa → `message` da API (409).

Casos-limite: as listas mostram todos os clubes, inclusive os sem escalação completa (DF11); clique duplo
cria uma só partida.

#### F14 · Histórico de partidas e classificação — 2

**Pedidos:** `GET /matches` (com e sem `club_id`), `GET /matches/{id}`, `GET /standings`.

- [ ] Histórico: data e hora, mandante, placar e visitante, da mais recente para a mais antiga (ordem da
      API), com filtro por clube.
- [ ] Ao abrir uma partida, os duelos vindos de `GET /matches/{id}`.
- [ ] Classificação **na ordem da API**, com posição, clube, jogos, vitórias, empates, derrotas, gols
      marcados, gols sofridos, saldo e pontos. A ficha zerou o F14 por reordenar a lista na tela.

---

## 3. Critérios de leitura, resumo

Complemento ao pedido: os critérios de leitura também orientam as decisões das fases 1 a 8. Três níveis
em B2 a B4 e F2 a F4 (integral, metade, zero); diferenciais tudo ou nada. Um defeito que já zerou um item
do F1 não é contado de novo em F2 ou F3.

### B2 · Qualidade do código do backend (10)

- [ ] **Camadas (2):** nenhuma rota de controller calcula regra (RN02 a RN06, RN11, RN13, RN15 a RN17,
      RN20, RN21) nem usa o Prisma. 1 ou 2 ocorrências → 1; 3 ou mais → 0.
- [ ] **Regras de negócio (2):** valor de mercado, overall, taxa, multa (dias restantes e percentual),
      comissão e placar, cada um num lugar só. 1 duplicado → 1.
- [ ] **Validação e erros (2):** os 18 endpoints com entrada (todos menos `GET /standings`) validam por
      mecanismo declarado (DTO, pipe, validador reutilizável), nunca por `if` no controller; recusas pelo
      filtro central; nenhum stack trace.
- [ ] **Consistência (2):** numa transação cada: compra (caixa, elenco, contrato, `COMPRA`); venda (caixa,
      jogador livre, contrato, `VENDA`, saída da escalação); partida e 6 duelos; escalação (formação e 5
      titulares); passagem a `DOENTE` e saída da escalação.
- [ ] **Segurança (1):** só ORM, sem SQL concatenado; segredos em variáveis de ambiente; CORS só para a
      origem do frontend lida de variável (`*` ou origem refletida não valem); nenhuma credencial real.
- [ ] **Código morto e padrão (1):** nenhum arquivo de `backend/` com código comentado, sem uso ou nome
      fora do padrão (identificador em português, por exemplo). 1 a 5 arquivos → 0,5.

### B3 · Banco de dados (6)

- [ ] **Criação reprodutível (2):** os comandos do README criam e recriam o banco do zero por migrations
      versionadas; o banco nasce vazio.
- [ ] **Estrutura (2):** nenhum desvio. Desvio = tabela, coluna, PK ou FK ausente ou com outro nome, ou
      moeda fora de DECIMAL/NUMERIC/centavos (a ficha perdeu 1 ponto por `valor_defensor` no lugar de
      `valor_defesa`). Colunas e índices a mais não contam.
  - [ ] `jogadores`: `id`, `nome`, `posicao`, `agilidade`, `idade`, `valor_base` DECIMAL(6,2), `condicao`,
        `clube_id` (FK, nulo), `velocidade`, `finalizacao`, `passe`, `drible`, `defesa`, `fisico`,
        `potencial`, `excluido_em`, `criado_em`, `atualizado_em`.
  - [ ] `clubes`: `id`, `nome`, `sigla`, `caixa` DECIMAL(10,2) padrão 300.00, `formacao` (nula),
        `criado_em`.
  - [ ] `contratos`: `id`, `jogador_id` e `clube_id` (FKs), `valor_compra` DECIMAL(6,2),
        `fidelidade_ate`, `situacao`, `iniciado_em`, `encerrado_em`.
  - [ ] `transacoes`: `id`, `clube_id` e `jogador_id` (FKs), `nome_jogador`, `tipo`, `valor`, `taxa`,
        `multa` DECIMAL(6,2), `lucro` DECIMAL(7,2) nulo, `variacao_caixa` DECIMAL(8,2), `criado_em`.
  - [ ] `escalacoes`: `clube_id` e `jogador_id` (FKs), `criado_em`; PK composta (`clube_id`,
        `jogador_id`).
  - [ ] `partidas`: `id`, `mandante_id` e `visitante_id` (FKs), `gols_mandante`, `gols_visitante`,
        `formacao_mandante`, `formacao_visitante`, `jogada_em`.
  - [ ] `duelos_partida`: `id`, `partida_id` (FK), `ordem`, `clube_atacante_id` (FK), `atacante_id` e
        `defensor_id` (FKs), `nome_atacante`, `nome_defensor`, `posicao_atacante`, `posicao_defensor`,
        `condicao_atacante`, `condicao_defensor`, `atributo_ataque`, `atributo_defesa`, `valor_ataque`,
        `valor_defesa`, `gol`.
- [ ] **Restrições (2):** unicidade no banco para o nome do clube (sem caixa, com acento), para
      `clubes.sigla` e para `escalacoes.jogador_id`; nenhuma coluna de valor de mercado, overall, valor do
      elenco, patrimônio, dias restantes, % de multa, pontos ou posição. Conferência por inserção direta:
      "Águias FC" e "águias fc" recusados; "Águias FC" e "Aguias FC" aceitos; sigla repetida recusada;
      jogador em duas escalações recusado.

### B4 e F4 · README e Git (2 + 2)

- [ ] **README do backend (1):** itens 1 e 3 a 8. **README do frontend (1):** itens 1, 3, 4 e 5. O item 2
      (banco) conta só no B3; os itens 7 e 8 só no B4.
- [ ] Correto = comando funciona como escrito; toda variável lida pelo código está no `.env.example` (a
      ficha perdeu por `CORS_ORIGIN`); toda biblioteca além da stack está listada com o motivo e existe nas
      dependências (a ficha perdeu por `dayjs`); item 1 com versões; item 3 com origem da API, URL do
      frontend e arquivos de trava versionados; item 8 com ferramentas, onde, como e por quê, e o que foi
      aceito, alterado ou descartado.
- [ ] **Git (1 em cada parte):** pelo menos 10 commits que alteram a pasta, enviados (push) em pelo menos
      3 dias diferentes (horário de Brasília, pelo histórico de envios da plataforma), com no máximo
      metade das mensagens genéricas. Push forçado conta só no dia dele. A ficha perdeu no F4 por envios
      em só 2 dias.

### B5 · Diferenciais do backend (0,5 cada, teto 2)

- [ ] Testes: o comando do README termina sozinho, em até 10 min, sem falhas, com teste do valor de
      mercado.
- [ ] Docker: um comando sobe interface, API e banco, e a lista de jogadores abre na URL do frontend.
- [ ] Swagger: a URL do README abre com os 19 endpoints de "2. Endpoints".
- [ ] Logs: uma única linha por requisição, com data e hora legíveis, método, caminho e status, pelo
      Logger do Nest.
- [ ] Lint e formatação: comandos do README sem erros; o de formatação só verifica.

### F2 · Qualidade do código do frontend (10)

- [ ] **Componentes (2):** tabela (cabeçalho, linhas, carregamento, vazio, erro), campo (rótulo e erro) e
      aviso (sucesso e erro) vêm de componentes compartilhados. 1 duplicado → 1.
- [ ] **Acesso à API (2):** nenhum `fetch` ou Axios dentro de componente; cada componente conta.
- [ ] **Atualização e regras (2):** as 9 ações (cadastrar, editar, alterar condição, excluir, criar clube,
      comprar, vender, escalar, jogar partida) atualizam a tela pela API sem recarregar; nenhum valor da
      API recalculado (a exceção é custo total = valor + taxa).
- [ ] **Formulários (2):** os 7 (cadastro, edição, condição, clube, compra, escalação, partida) validam
      antes de enviar os obrigatórios, os tamanhos (nome do jogador 3 a 100, nome do clube 3 a 60, sigla
      com 3 letras) e as faixas (agilidade 1 a 100, idade 16 a 45, atributos e potencial 1 a 99), com a
      mensagem junto ao campo, e enviam datas com `-03:00`. Escalação: formação e as 5 vagas; partida:
      mandante e visitante.
- [ ] **Código morto e padrão (2):** nenhum arquivo de `frontend/` com código comentado, sem uso ou nome
      fora do padrão. 1 a 5 arquivos → 1.

### F3 · Usabilidade e feedback (6)

- [ ] **Mensagens (2):** as 9 ações mostram sucesso e, na recusa da API (409 ou 404), o `message`; clique
      duplo envia um só pedido (conferido no HAR).
- [ ] **Estados (2):** carregamento, lista vazia e erro nas 6 telas de lista: jogadores, clubes, elenco,
      histórico de transações, histórico de partidas e classificação. Vazio com o banco recriado e num
      clube novo; erro com o backend parado; carregamento com a rede lenta.
- [ ] **Apresentação (2):** moeda com 2 casas e vírgula e datas em Brasília em: lista de jogadores,
      clubes, página do clube com o histórico, resultado da compra, resultado da venda e histórico de
      partidas.

### F5 · Diferenciais da interface (teto 2)

- [ ] Responsividade (1): com 375 px, a lista de jogadores e a página do clube com o histórico sem rolagem
      horizontal da página (as tabelas podem rolar no próprio quadro) e com todas as ações acessíveis.
- [ ] Testes (1): o comando do README termina sozinho, sem falhas, com pelo menos um teste de componente.
- [ ] Lint e formatação (0,5).

---

## 4. Pontos deixados para decisão do candidato

O enunciado manda decidir e registrar no README (Premissas, "Detalhes não definidos"); o barema garante
que nenhuma verificação depende dessas escolhas (3.3 e 3.4). **Tudo abaixo é proposta, ainda não
aprovada.** Depois do seu ok, as aprovadas vão para "Decisões e premissas" do README.

### Backend

| # | Ponto em aberto | O que o enunciado diz | Proposta |
| --- | --- | --- | --- |
| D01 | Ordem das validações | V9: "A correção nunca combina dois erros no mesmo pedido" | 400 (corpo e query) → 404 (id da URL, depois ids do corpo) → 409. Entre os 409, ordem fixa: compra = não livre → recompra → elenco cheio → limite de 50%; escalação = fora do elenco → `DOENTE` → formação; `PUT` = posição → idade. |
| D02 | Texto das mensagens de erro | Convenções: "O texto da mensagem é livre" | Português, específico e com o valor envolvido, no modelo do enunciado: "O custo da compra (50,40) passa do limite de 50% do caixa (50,00)." |
| D03 | Método não previsto num caminho existente | 2.5: "pode responder 404 ou 405 e não é conferido" | 404 (padrão do Nest), com `{ message }`. |
| D04 | Corpo enviado em pedido sem corpo | V1: "um corpo enviado é ignorado" | JSON válido é ignorado. JSON malformado nesses pedidos dá 400 pelo parser global (o script não envia corpo neles). |
| D05 | O que é "caractere de controle" | V4 só dá exemplos (tabulação, quebra de linha) | Categoria Unicode Cc (U+0000 a U+001F e U+007F a U+009F). Outros espaços Unicode (como U+00A0) não são "espaço" (só U+0020) nem controle: contam como caractere comum. |
| D06 | Pedaço sem letra entre palavras | V4: "palavra é uma sequência sem espaços com pelo menos uma letra"; não diz se pedaços sem letra são permitidos | Permitidos, mas não contam como palavra: `"Ana - Lima"` tem 2 palavras. Vale para jogador e clube. |
| D07 | Normalização Unicode do texto | Não definida | Nenhuma além da V4: grava e devolve o texto como chegou; tamanho em pontos de código. |
| D08 | Espaços na sigla | V4 vale "nos campos de nome e no `search`" | A sigla não passa pela V4: `" AGU"` → 400. |
| D09 | "Primeira letra do nome", na sigla | Limites, `acronym` | O primeiro caractere da categoria L do nome depois da V4, comparado sem caixa e sem acento. |
| D10 | Como ignorar maiúsculas na unicidade do nome | RN10 | `toLowerCase()` sem locale sobre o nome depois da V4, gravado em `clubes.nome_normalizado` com índice único. Não depender de `lower()` nem da collation do banco. |
| D11 | Precisão do "instante exato do servidor" | RN01 | Milissegundos do relógio do servidor. `created_at` e `played_at` gravados com milissegundos e devolvidos truncados ao segundo; dias restantes calculados em milissegundos. |
| D12 | "Até 1.095 dias depois" | Limites, `loyalty_until` | Inclusivo: fim ≤ agora + 1.095 × 24 h (o fuso é fixo em −03:00, então dia = 24 h). |
| D13 | Pedidos simultâneos (duas compras do mesmo jogador) | Não definido | Dentro da transação, atualizar o jogador só se ainda estiver livre; se nenhuma linha mudar → 409. |
| D14 | Parâmetro repetido (`?page=1&page=2`) | "a correção não envia parâmetro repetido" | 400. |
| D15 | Formato do `Location` | Caminho a partir da raiz ou URL absoluta | Caminho: `/api/v1/players/{id}`. |
| D16 | Cabeçalhos do CSV | `Content-Disposition` e charset opcionais | `text/csv; charset=utf-8` e `Content-Disposition: attachment; filename="historico-clube-{id}.csv"`. |
| D17 | Erro inesperado (500) | 2.5: "a operação é desfeita por inteiro" | `{ "message": "Erro interno. Tente novamente." }`, sem detalhes; o detalhe vai só para o log do servidor. |
| D18 | Formato da linha de log | B5: data e hora legíveis, método, caminho e status, numa única linha | Logger do Nest, contexto `HTTP`, uma linha ao fim da resposta: `GET /api/v1/players?page=1 200 12ms`. |
| D19 | O que roda no `npm test` | B5: termina sozinho, sem falhas, em até 10 min | `npm test` só com testes que não precisam de banco (domínio e serviços com repositório falso). Testes e2e em `npm run test:e2e`, num banco de teste separado, descritos no README como opcionais. |
| D20 | Dados de exemplo | README item 2: banco começa vazio; exemplo só por comando separado e opcional | `npm run db:seed` separado e marcado como opcional; `db:reset` com `--skip-seed`, sem `prisma.seed` no `package.json`. |
| D21 | Portas e origens | Não definidas | API em `http://localhost:3000`; frontend em `http://localhost:5173` com porta fixa (`strictPort`); `FRONTEND_ORIGIN=http://localhost:5173`. |
| D22 | Comandos do README | Modelo sugerido no enunciado | Raiz: `docker compose up -d --wait db`. Backend: `cp .env.example .env`, `npm ci`, `npx prisma migrate deploy`, `npm run build`, `npm run start:prod`. Frontend, em outro terminal: `cp .env.example .env`, `npm ci`, `npm run dev`. Recriar: `npm run db:reset` na pasta `backend`. |

### Frontend

| # | Ponto em aberto | O que o enunciado diz | Proposta |
| --- | --- | --- | --- |
| DF1 | Como mostrar o clube na tabela de jogadores | "nome ou sigla; 'Livre' quando não houver"; a API devolve só `club_id` | Sigla, tirada do `GET /clubs` que a tela já carrega para o filtro de clube e para a compra. Alternativa: campo extra `club_acronym` na API (campos extras são permitidos). |
| DF2 | Forma da confirmação | Barema 3.4: "qualquer escolha coerente é aceita" | Modal próprio com Confirmar e Cancelar, usado em excluir, comprar e vender. |
| DF3 | Lugar do aviso | Idem | Aviso de sucesso ou de erro da API no topo da área da tela; erros de validação junto ao campo. |
| DF4 | "Só livres" junto com clube | F02: impedir ou mostrar o `message` | Impedir: com "só livres" marcado, o filtro de clube fica desabilitado, com o motivo escrito ao lado. |
| DF5 | `DOENTE` → `APTO`, posição de jogador com clube, idade menor | Frontend, "Mensagens e apresentação": pode impedir ou enviar | Enviar e mostrar o `message` da API, para a regra ficar num lugar só. |
| DF6 | Busca | `search` exige 2 a 100 caracteres | Envia só com 2 ou mais caracteres (depois de tirar espaços), com uma pequena espera depois da digitação; com 1 caractere, aviso junto ao campo. Mudar busca, filtro ou ordenação volta à página 1. |
| DF7 | Filtro de valor | A API só aceita ponto decimal | O campo aceita vírgula e converte para ponto antes de enviar; vazio = sem filtro; recusa da API vira aviso. |
| DF8 | Datas na tela | "no horário de Brasília" | Exibir `dd/mm/aaaa HH:mm` com `timeZone: 'America/Sao_Paulo'`. Entrada em campo de data e hora local, enviada como o texto digitado + `-03:00`. |
| DF9 | Moeda | "2 casas e vírgula decimal" | `Intl.NumberFormat('pt-BR')` com 2 casas, sem símbolo, com "(moedas)" no cabeçalho da coluna; variação do caixa e lucro sempre com sinal. |
| DF10 | Tela de escalação | "um titular para cada vaga dela" | Vagas montadas pela formação (1 GOL e as vagas de cada setor); cada vaga lista só os jogadores do elenco daquela posição, sem `DOENTE` e sem os já escolhidos; aviso "não pode jogar" quando `complete` vier `false`. |
| DF11 | Formulário de partida | Mandante igual ao visitante é 400 | O formulário exige os dois e diferentes; as listas mostram **todos** os clubes, e o clube sem escalação completa é enviado para a tela mostrar o 409. |
| DF12 | Atualização depois das 9 ações | "a tela mostra os dados atualizados pela API, sem recarregar a página" | Depois de cada ação com sucesso, invalidar todas as queries (o app é pequeno, e isso evita esquecer escalação, classificação ou clubes). |
| DF13 | Novas tentativas automáticas | Não definido | Queries com no máximo 1 nova tentativa e mutações sem nova tentativa, para o estado de erro aparecer logo com o backend parado. |
| DF14 | Rota inicial | B5 Docker: "a lista de jogadores abre na URL do frontend" | `/` abre a lista de jogadores; a tela inicial do mockup fica de fora (é opcional). |
| DF15 | Opções do filtro por jogador | "escolhido entre os jogadores que aparecem no histórico do clube" | Tiradas do histórico **sem filtro**, o que inclui jogadores excluídos (são eles que provocam o 404 do F09). |
| DF16 | Download do CSV | "baixa o arquivo devolvido pela API" | Função em `src/api` pede o arquivo com os filtros; a tela salva como `historico-<sigla>.csv`; erro em JSON vira aviso com o `message`. |
| DF17 | Nome dos atributos no duelo | A API devolve `shooting`, `passing`, `dribbling`, `defending` | Traduzir na tela: Finalização, Passe, Drible, Defesa. |
| DF18 | Clique duplo | "a mesma ação não é enviada duas vezes" | Botão desabilitado enquanto o pedido está em andamento e, no hook da ação, ignorar um segundo envio enquanto o primeiro não termina. |

---

## 5. Divergências com docs/plano.md

"Conflito" = o plano (ou o `CLAUDE.md`, que é parte dele) diz algo diferente do enunciado ou do barema.
"Lacuna" = o plano não trata um ponto que pode custar pontos. Ordenadas por gravidade.

| # | Tipo | Gravidade | Onde | O que diverge | Proposta |
| --- | --- | --- | --- | --- | --- |
| 1 | Conflito | Alta | Os 3 `CLAUDE.md`, plano §10 e prompts | Todos citavam `docs/enunciado.md`, mas o arquivo se chamava `docs/desafio.md`. | **Resolvida na Fase 0:** arquivo renomeado para `docs/enunciado.md`, sem mudar o conteúdo. |
| 2 | Lacuna | Alta | `CLAUDE.md` raiz, "Fontes da verdade" | A ordem "enunciado > este arquivo > plano" não traz as erratas nem o barema. Ordem oficial: regulamento > erratas > barema (pontuação) > enunciado (requisitos). As erratas saíram até 16/10. | Conferir erratas e issues agora (aviso 2) e incluir erratas e barema na ordem do `CLAUDE.md`. |
| 3 | Lacuna | Alta | Plano §3 e prompts das fases 4 a 6 | Prevê testes e2e com Supertest, mas não diz se rodam no `npm test`. Se precisarem do Postgres ou apagarem dados, o `npm test` pode falhar na correção e custar o diferencial de testes (B5). | D19. |
| 4 | Lacuna | Alta | Prompt da Fase 2 (`db:reset`) | `prisma migrate reset` roda o seed sozinho se houver `prisma.seed` no `package.json`; o banco recriado não nasceria vazio (README item 2, B3). | D20. |
| 5 | Conflito | Média | Plano §8, ordem de corte | "Docker completo" é o último a cortar, mas é o único corte que não custa ponto: o B5 soma 5 × 0,5 = 2,5, com teto de 2. Cortar a responsividade custa 0,5; cortar também os testes do front custa mais 1,0. | Nova ordem: Docker completo → responsividade → testes do front. Fazer o Docker só se sobrar tempo, como seguro caso outro diferencial falhe. |
| 6 | Lacuna | Média | Plano §5, "V8" e "Query params" | O plano só diz que id fora do formato é 404 (vale para a URL). Id inválido em query (`club_id`, `player_id`) é 400. Também faltam o formato de `min_value`/`max_value` e as regras de parâmetro desconhecido (ignorado) e de caixa trocada (400). | Validações separadas para id da URL (404) e id de query (400). O `backend/CLAUDE.md` já tem os demais pontos. |
| 7 | Lacuna | Média | Plano §5, "CSV" | Faltam: `lucro` vazio na compra, negativo com `-`, sem separador de milhar, aspas só quando há `;` ou aspas, erros em JSON. O B19 vale 2 pontos, tudo ou nada. | Seguir a lista do B19 deste checklist. |
| 8 | Lacuna | Média | Plano §6 | A lista de colunas proibidas não traz "valor do elenco" nem "percentual de multa" (B3, "Falha"). | Completar a lista. |
| 9 | Lacuna | Média | Plano §5, "V4" | Falta: texto que fica vazio conta como ausente (400). Também não diz que a V4 não vale para a sigla. | D08. |
| 10 | Lacuna | Média | Plano §7 e prompt da Fase 7 | O TanStack Query tenta de novo 3 vezes por padrão (cerca de 7 s), o que atrasa o estado de erro com o backend parado (F3) e pode estourar os 10 s por ação. | DF13. |
| 11 | Lacuna | Média | Prompt da Fase 7 | "Invalidar as queries depois de cada ação" sem dizer quais. Venda e passagem a `DOENTE` mudam a escalação; criar clube muda a classificação; editar a idade muda o patrimônio. | DF12. |
| 12 | Lacuna | Média | Prompt da Fase 8, README | O barema considera o item 3 incorreto se não citar os arquivos de trava versionados. | Escrever no item 3 que `package-lock.json` está versionado nas duas pastas. |
| 13 | Lacuna | Média | Prompt da Fase 8, Docker | No compose completo, a API precisa liberar no CORS a origem do frontend em Docker, e a origem da API do frontend entra no build. | `FRONTEND_ORIGIN` do compose = URL do frontend em Docker. |
| 14 | Lacuna | Média | Prompt da Fase 1 | Os geradores do Nest e do Vite criam código de exemplo ("Hello World", `App.css`, `react.svg`, contador). Se ficar, conta como código sem uso (B2 e F2). | Remover no esqueleto. |
| 15 | Lacuna | Baixa | Plano §1 | "Público até 26/10 às 12h": o enunciado também exige que continue público, sem reescrever o histórico, até a divulgação do resultado. | Completar a frase. |
| 16 | Lacuna | Baixa | Plano §7 | "validam obrigatórios e faixas": o barema também exige o tamanho dos textos (nome 3 a 100, clube 3 a 60, sigla 3 letras). O `frontend/CLAUDE.md` já tem. | Completar a frase. |
| 17 | Lacuna | Baixa | Plano §5, "Ordem alfabética" | O enunciado compara por ponto de código; a comparação padrão de texto do JavaScript usa unidades UTF-16, que diferem para caracteres fora do plano básico (emoji, por exemplo). | Comparar ponto de código a ponto de código. |
| 18 | Lacuna | Baixa | Modelo de comandos do README | `docker compose up -d db` volta antes de o banco aceitar conexões, e o `migrate deploy` logo depois pode falhar. | `docker compose up -d --wait db`, que espera o healthcheck. |
| 19 | Lacuna | Baixa | Plano §3, logs | Um middleware que registra no início e no fim gera duas linhas; o B5 pede uma única linha por requisição. | D18. |
| 20 | Conflito | Baixa | Plano §4 | "Repository: único lugar com Prisma" e "Service abre a transação" se contradizem. O barema só conta violação no controller, então não custa ponto. | A camada de dados oferece um utilitário que executa uma função dentro de uma transação, e o service o chama. |
| 21 | Conflito | Baixa | Plano §10 | Diz que `docs/plano.md` traz só as seções 4 a 7; o arquivo traz o plano inteiro (seções 1 a 12). | Só informativo. |

**O que confere:** stack e versões; estrutura `backend/` + `frontend/` na raiz; camadas e cálculos em
`src/domain`; decimal.js com arredondamento único; V1, V2, V7 e V8; datas da RN01 sem depender do fuso;
dias restantes para cima e a mesma função na venda e na consulta do clube; `nome_normalizado` único;
recompra pela transação `VENDA`; escalação com PK composta e `jogador_id` único; transações do banco nas 5
operações; regras do frontend (camada de API, componentes compartilhados, nada recalculado, `message` da
API, clique duplo); metas de Git (10 ou mais commits por pasta, push em 3 ou mais dias); e-mail de
entrega.
