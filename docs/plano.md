Plano v2 – Passe · Estudo de caso SENAI/PE CÓD. 237 (Fullstack I)
Prazo: sexta, 23/10/2026, às 20h (Brasília). Meta interna: e-mail enviado até as 18h. Este plano substitui a v1 (produtos e cupons), feita sobre uma versão antiga do enunciado.
1. Regras que eliminam ou zeram
Risco
O que fazer
Pastas frontend/ e backend/ ausentes na raiz
Estrutura exatamente backend/ + frontend/ na raiz. Nada de apps/.
Tecnologia fora da lista
Node 22 LTS + TypeScript + NestJS; React com Vite (react-ts); PostgreSQL 16. Sem SQLite, sem Next.js.
Hash ausente ou errado
Enviar o hash completo de 40 caracteres (git rev-parse HEAD), já com push feito.
E-mail errado
Do endereço em que o RH fala com você. Para igor.conde@sistemafiepe.org.br, Cc rachel.santos@sistemafiepe.org.br, assunto SENAI/PE – CÓD. 237 DESENVOLVEDOR I (FULLSTACK). Corpo: nome completo, link, hash. Sem anexo, sem zip.
Repositório privado
Público até 26/10 às 12h e sem reescrever histórico até o resultado.
Aplicação não sobe
A banca segue só o README, em Ubuntu 24.04 limpo, em até 30 min. Se a API não subir, zeram mais de 60 pontos. Testar num clone limpo antes de enviar.
Dependência de algo seu
Nada de imagem Docker própria nem serviço hospedado. A Vercel sai do plano.
2. Onde estão os pontos
Bloco
Pontos
Como é avaliado
Prioridade
B1 Roteiro da API
30
Script automático, tudo ou nada por item
Máxima
F1 Roteiro da interface
30
Pessoa usando a tela, tudo ou nada
Máxima
B2 e F2 Qualidade de código
10 + 10
Rubrica com contagem de ocorrências
Alta
B3 Banco
6
7 tabelas com nomes exatos e unicidades
Alta e barata
F3 Usabilidade
6
Mensagens, estados das telas, formatação
Alta e barata
B4 e F4 README e Git
2 + 2
10 ou mais commits por pasta, push em 3 ou mais dias
Barato, não esquecer
B5 e F5 Diferenciais
2 + 2
Testes, Docker, Swagger, logs, lint; responsivo, testes, lint
Médio
Aprovação: nota 7,0 ou mais, com pelo menos 2,5 no backend e 2,5 no frontend. As tabelas de exemplo do enunciado foram conferidas pela banca: viram testes unitários literais.
3. Stack definitiva
Camada
Escolha
Motivo
Runtime
Node.js 22 LTS + npm, com package-lock.json versionado
A banca instala só Node com npm.
Backend
NestJS 11 + TypeScript strict
Camadas e injeção de dependência prontas; pipes e filtros dão validação e erro centralizados (B2).
ORM
Prisma 6 + PostgreSQL 16 em Docker
Migrations versionadas; @@map e @map dão os nomes em português exigidos.
Dinheiro
decimal.js + colunas DECIMAL
Arredondamento meio para longe do zero uma única vez; limite de 50% sem arredondar.
Validação
class-validator + class-transformer sem conversão implícita
Texto "15" precisa ser recusado (V2).
Docs e logs
@nestjs/swagger em /api/docs; Logger do Nest num middleware
Diferenciais B5.
Testes do backend
Jest, npm test sem watch
Diferencial B5, com as tabelas do enunciado.
Frontend
React 19 + Vite react-ts, React Router em modo biblioteca, TanStack Query, React Hook Form + Zod, Tailwind
Tudo permitido; o Query resolve atualização sem recarregar e estados de carregamento e erro.
Testes do frontend
Vitest + Testing Library, vitest run
Diferencial F5.
Qualidade
ESLint + Prettier nas duas pastas, scripts lint e format:check
Diferenciais B5 e F5.
4. Arquitetura do backend
Módulos por domínio: players, clubs, market (compra, venda, histórico, CSV) e league (escalação, partidas, classificação). Dentro de cada um, as mesmas camadas:
1. Controller: só HTTP. Nunca calcula regra nem usa o Prisma (o B2 conta cada ocorrência).
2. Service: orquestra e abre a transação do banco.
3. Domain (src/domain/): funções puras, sem Nest nem Prisma. Cada cálculo existe em um único arquivo: valor de mercado (RN02 a RN05), overall e valor base (RN06), taxa (RN13), dias restantes e percentual de multa (RN15, usado pela venda e pela consulta do clube), comissão (RN16), motor da partida (RN20), classificação (RN21), arredondamento, texto (V4, ordem alfabética, busca sem acento) e datas (RN01).
4. Repository: único lugar com Prisma.
Transversal em src/common/: filtro global de exceções (sempre { "message": "..." }, sem stack trace, inclusive rota inexistente e JSON inválido), pipe de id da URL, validação, middleware de log e CORS pela variável FRONTEND_ORIGIN.
5. Armadilhas do enunciado e decisões fechadas
Ponto
Decisão
V1 corpo que não é objeto
Recusar array e valor simples com 400; JSON inválido vira 400 com message.
V2 tipos
Sem conversão implícita: "15" é 400; 50.5 em inteiro é 400; 50.0 chega como 50 e passa.
V7 campos extras
whitelist ligado e forbidNonWhitelisted desligado: campo desconhecido é ignorado, nunca 400.
V4 nomes
Remover espaços das pontas e colapsar repetidos antes de validar o tamanho; caractere de controle é 400.
V8 id na URL
Só dígitos, sem zero à esquerda, até 2.147.483.647; fora disso é 404, não 400. Jogador excluído conta como inexistente em tudo.
Query params
Inteiros estritos; valor vazio é 400; free=true junto com club_id é 400; sort com até 2 critérios sem repetir campo.
Ordem alfabética
Decompor em NFD, tirar marcas de acento, minúsculas, comparar por código Unicode; empate pelo id. Feita na aplicação, não pela collation do banco.
Listagem de jogadores
Filtrar no banco o que é coluna; calcular o valor de mercado no domínio; filtrar por valor, ordenar e paginar na aplicação. O cálculo fica num lugar só.
Datas RN01
Entrada só no formato AAAA-MM-DDTHH:MM-03:00, validando se a data existe; saída AAAA-MM-DDTHH:MM:SS-03:00. Nunca depender do fuso da máquina.
Dias restantes
Arredondar a diferença em dias para cima, mínimo 0. Foi o erro da ficha de exemplo: não truncar.
Nome do clube
Coluna nome_normalizado (espaços normalizados e minúsculas, mantendo acentos) com índice único.
Recompra
Proibida se existir transação VENDA daquele clube com aquele jogador.
Escalação
Tabela escalacoes com chave composta e jogador_id único, mais clubes.formacao. Venda e passagem a DOENTE tiram o titular na mesma transação.
Partida
Motor puro na ordem do elenco; × 0,85 com meio para cima; gol só se ataque maior que defesa; partida e 6 duelos numa transação.
CSV
UTF-8 sem BOM, fim de linha LF inclusive na última, separador ponto e vírgula, vírgula decimal, aspas duplicadas, só o cabeçalho quando vazio.
Códigos
Validação 400, inexistente 404, regra de negócio 409. Ordem: formato, depois existência, depois regra.
6. Banco (B3)
As 7 tabelas com nomes e colunas exatamente como na seção 3 do enunciado: jogadores, clubes, contratos, transacoes, escalacoes, partidas e duelos_partida. Modelos Prisma em inglês com @@map e @map. Moeda em Decimal. Nenhuma coluna para valor de mercado, overall, patrimônio, dias restantes, pontos ou posição. O banco nasce vazio; dados de exemplo só por comando separado e opcional.
7. Frontend
Telas: Jogadores (tabela, filtros, paginação, cadastro, edição, condição, excluir, comprar), Clubes (lista, criar, ordenar), Clube (resumo, elenco com contrato, vender, histórico com filtros, summary e CSV, aba Escalação), Partidas (jogar, resultado com 6 duelos, histórico com filtro) e Classificação.
O que vale ponto:
• Todas as chamadas em src/api/ e hooks; nenhum fetch dentro de componente.
• Componentes compartilhados: tabela (com carregamento, vazio e erro), campo de formulário e aviso de feedback. Nenhuma tela monta tabela própria.
• Nunca recalcular o que a API devolve; mostrar a ordem que a API devolve (classificação, clubes, elenco).
• Botão desabilitado durante o envio: clique duplo gera um só pedido.
• Mostrar sempre o message da API nas recusas, nunca texto genérico.
• Moeda com 2 casas e vírgula; datas em Brasília; datas digitadas enviadas com -03:00.
• Os 7 formulários validam obrigatórios e faixas antes de enviar, com a mensagem junto ao campo.
• 375 px sem rolagem horizontal da página.
8. Cronograma
Quando
Entrega
Push
Terça (hoje, à noite)
Fases 0 e 1: docs, CLAUDE.md, esqueleto de backend/ e frontend/, banco no Docker, lint, filtro de erros.
Sim, dia 1 de envio, com commits nas duas pastas.
Quarta
Fase 2 (7 tabelas e migrations), Fase 3 (domínio com todos os testes das tabelas), Fase 4 (jogadores e clubes na API). Início do front: layout e tela de jogadores.
Sim, dia 2.
Quinta
Fase 5 (compra, venda, histórico, CSV), Fase 6 (escalação, partidas, classificação), telas de clubes, clube, compra e venda.
Sim, dia 3.
Sexta até 16h
Telas de histórico, escalação, partidas e classificação; Fase 8: Docker completo, README, revisão pelo barema, teste em clone limpo.
Sim.
Sexta, 16h às 18h
Correções da revisão, último push, conferir repositório público, enviar o e-mail com o hash.
Final.
Se atrasar, a ordem de corte é: responsividade, depois testes do front, depois Docker completo. Nunca cortar o README nem tela que faz parte do F1.
9. Git
• Trabalhar direto na main, um commit por mudança lógica que compila e passa nos testes. Merges não contam como commit.
• Push ao fim de cada bloco, todos os dias. Meta: 20 ou mais commits em backend/ e 15 ou mais em frontend/.
• Conventional Commits em português e descritivos, por exemplo feat(players): calcula valor de mercado pelas RN02 a RN05. Nunca mensagem só com palavras genéricas (fix, ajustes, update, wip, teste).
• Usar o e-mail noreply do GitHub no git config.
• Nunca push --force depois do primeiro envio.
• O Claude Code não commita sozinho: propõe a mensagem, você revisa e commita.
10. Arquivos de contexto para o Claude Code
• docs/enunciado.md, docs/barema.md, docs/glossario.md e docs/ficha-avaliacao-exemplo.md: cópia literal dos arquivos do repositório do SENAI.
• docs/mockup-tela-inicial.png.
• docs/plano.md: as seções 4 a 7 deste plano.
• docs/ia.md: diário do uso de IA, preenchido ao longo dos dias, base da seção obrigatória do README.
• CLAUDE.md na raiz:
# CLAUDE.md
Projeto: Passe, estudo de caso SENAI/PE CÓD. 237.
Fonte da verdade: docs/enunciado.md e docs/barema.md. Em divergência, o enunciado vence este arquivo.

## Stack
backend/: Node 22, NestJS 11, TypeScript strict, Prisma 6, PostgreSQL 16, decimal.js, Jest.
frontend/: React 19 + Vite react-ts, React Router, TanStack Query, React Hook Form + Zod, Tailwind, Vitest.
Gerenciador: npm, sempre com package-lock.json versionado.

## Arquitetura
- Controller só HTTP. Service orquestra e abre transação. Domain = funções puras. Repository = único com Prisma.
- Cada cálculo (valor de mercado, overall, valor base, taxa, multa e dias, comissão, partida, classificação)
  existe em UM arquivo de src/domain.
- Erros sempre em JSON { message }, sem stack trace. 400 formato, 404 inexistente, 409 regra.
- Campos desconhecidos são ignorados, nunca 400. Sem conversão implícita de tipos.
- API em snake_case. Tabelas e colunas com os nomes exatos do enunciado via @@map e @map.
- Frontend: chamadas só em src/api e hooks; nunca recalcular valores da API; mostrar o message da API.

## Proibido
- Commitar sozinho, push --force, código comentado, código sem uso, console.log.
- Inventar regra: na dúvida, citar o trecho do enunciado e perguntar.

## Pronto = lint + format:check + testes verdes + regra citada (RNxx) no teste.
11. Prompts por fase
Use /clear entre as fases e peça o plano antes do código em cada uma.
Fase 0 · Leitura, sem código
Leia CLAUDE.md, docs/enunciado.md, docs/barema.md, docs/glossario.md e docs/ficha-avaliacao-exemplo.md inteiros.
Não escreva código. Produza docs/checklist.md com: (1) cada item B01 a B22 e F01 a F14 do barema, com as regras
que ele verifica e os casos-limite; (2) os pontos deixados para decisão do candidato, com uma proposta.
Compare com docs/plano.md e aponte divergências.
Fase 1 · Esqueleto
Crie backend/ (NestJS, npm, TypeScript strict) e frontend/ (Vite react-ts, npm), sem regra de negócio:
- backend: prefixo global /api/v1, validação das variáveis de ambiente, .env.example, CORS só para FRONTEND_ORIGIN,
  filtro global de exceções devolvendo { message } (inclusive rota inexistente e JSON inválido), recusa de corpo
  que não é objeto, middleware de log (data e hora, método, caminho, status) com o Logger do Nest, Swagger em
  /api/docs, ESLint + Prettier com scripts lint e format:check, Jest com npm test sem watch.
- docker-compose.yml na raiz só com postgres:16-alpine e healthcheck.
- frontend: Tailwind, React Router, TanStack Query, cliente HTTP em src/api com VITE_API_URL, ESLint, Prettier, Vitest.
Pare ao fim de cada passo e proponha a mensagem de commit.
Fase 2 · Banco
Configure o Prisma com as 7 tabelas da seção 3 do enunciado, nomes e colunas exatos via @@map e @map, Decimal nas
colunas de moeda, chave composta em escalacoes com jogador_id único, clubes.nome_normalizado único e clubes.sigla
única. Nenhuma coluna de valor calculado. Gere a migration e mostre o SQL antes de aplicar.
Scripts: db:migrate (migrate deploy), db:reset (migrate reset --force) e db:seed opcional e separado.
Fase 3 · Domínio em TDD
Em backend/src/domain, escreva primeiro os testes usando literalmente todas as tabelas de exemplo do enunciado
(RN05, overall, valor base, RN13, RN15, comissão, crédito, partida Águias x Delta, classificação de 6 clubes) e os
casos de arredondamento (14,775 vira 14,78; 0,385 vira 0,39; 8,7875 vira 8,79). Mostre-os falhando. Depois
implemente com decimal.js, uma função por regra, sem Nest nem Prisma.
Fase 4 · Jogadores e clubes
Implemente os endpoints de jogadores (2.1) e clubes (2.2) seguindo V1 a V9, os limites de cada campo e RN06 a RN11.
Pipe de id da URL com regex estrita e limite de 2147483647, senão 404. DTOs em snake_case sem conversão implícita.
Testes e2e com Supertest para cada status do enunciado, inclusive 201 com Location e 204 sem corpo.
Fase 5 · Mercado
Implemente compra, venda, histórico e exportação CSV (2.3, RN12 a RN18), cada operação numa transação.
Use o domínio já testado; a consulta do clube e a venda usam a MESMA função de dias restantes.
Venda e passagem a DOENTE tiram o titular da escalação na mesma transação.
Teste e2e reproduzindo a história do Meia Lua do enunciado, campo a campo.
Fase 6 · Liga
Implemente escalação, partidas e classificação (2.4, RN19 a RN21). Partida e 6 duelos numa transação, com nomes,
posições, condições e valores do momento. Teste e2e reproduzindo Águias FC 1 x 2 Delta FC duelo a duelo.
Fase 7 · Frontend
Leia a seção Frontend do enunciado e os itens F01 a F14, F2 e F3 do barema. Proponha a árvore de componentes antes
de codar. Componentes compartilhados de tabela (carregamento, vazio, erro), campo de formulário e feedback.
Chamadas só em src/api e hooks do TanStack Query, invalidando as queries depois de cada uma das 9 ações.
Nunca recalcule valores da API. Uma tela por vez, na ordem do roteiro F1; pare ao fim de cada uma.
Fase 8 · Entrega
1) Dockerfiles e docker-compose com um profile que sobe banco, API e interface com um comando.
2) README da raiz com os 8 itens obrigatórios em seções próprias: pré-requisitos com versões; criar e recriar o
   banco; instalar e executar no Ubuntu 24.04 com comandos copiáveis, origem da API e URL do frontend; variáveis;
   estrutura e bibliotecas com o motivo; Decisões e premissas; Funcionalidades não implementadas; Uso de IA.
3) Revise o repositório como avaliador, item a item do barema, e liste o que perderia ponto.
Seção Uso de inteligência artificial: ferramentas (Claude Code no Antigravity e Claude para o planejamento), onde (por pasta e funcionalidade), como e por quê, e o que você aceitou, alterou ou descartou, com exemplos concretos tirados do docs/ia.md. Deixe claro o seu papel de orquestrador: você decidiu arquitetura, regras e prioridades e revisou cada commit.
12. Checklist de envio
[ ] Clone limpo: o README, seguido ao pé da letra, sobe banco, API e interface em menos de 30 minutos
[ ] npx prisma migrate reset --force recria o banco vazio
[ ] npm test, npm run lint e npm run format:check verdes nas duas pastas
[ ] Toda variável usada está no .env.example; toda biblioteca está no README com o motivo
[ ] Push em pelo menos 3 dias; 10 ou mais commits em cada pasta; mensagens descritivas
[ ] Repositório público; hash de 40 caracteres copiado do git rev-parse HEAD
[ ] E-mail do endereço do RH, com Cc, assunto exato e sem anexos
[ ] Você consegue explicar cada decisão da seção 5 na entrevista