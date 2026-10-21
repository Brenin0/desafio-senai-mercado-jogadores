# CLAUDE.md — Passe (raiz)

Projeto: **Passe**, estudo de caso do processo seletivo SENAI/PE – CÓD. 237 Desenvolvedor I (Fullstack).
Aplicação web fullstack de mercado de jogadores de uma liga fictícia: jogadores, clubes, mercado (compra,
venda, histórico, CSV) e liga (escalação, partidas, classificação).

## Fontes da verdade (ler antes de qualquer tarefa)

1. `docs/enunciado.md` — requisitos, regras RN01 a RN21, validações V1 a V9, contrato da API, tabelas do banco.
2. `docs/barema.md` — como cada item é pontuado (B01–B22, F01–F14, B2, B3, F2, F3).
3. `docs/glossario.md` e `docs/ficha-avaliacao-exemplo.md` — termos e exemplo de correção (mostra erros reais).
4. `docs/plano.md` — decisões técnicas já tomadas.

Em divergência, vale: enunciado > este arquivo > plano. **Nunca invente regra.** Se algo não estiver
definido, pare, cite o trecho do enunciado e pergunte. Decisões novas vão para a seção
"Decisões e premissas" do README.

Os arquivos de `docs/` são cópias literais do enunciado: **não edite** `enunciado.md`, `barema.md`,
`glossario.md` nem `ficha-avaliacao-exemplo.md`.

## Estrutura obrigatória

```
/
├── backend/     NestJS + Prisma + PostgreSQL (ver backend/CLAUDE.md)
├── frontend/    React + Vite (ver frontend/CLAUDE.md)
├── docs/
├── docker-compose.yml
└── README.md
```

As pastas `backend/` e `frontend/` ficam **na raiz**. Nunca crie `apps/`, `packages/` ou monorepo com workspaces.

## Stack permitida (fora dela, o candidato é eliminado)

- Node.js 22 LTS, TypeScript strict, **npm** (sempre versionar `package-lock.json`; nunca pnpm ou yarn).
- Backend: NestJS 11, Prisma 6, PostgreSQL 16 (imagem pública `postgres:16-alpine`).
- Frontend: React com Vite (template `react-ts`). Proibido: Next.js, Remix, CRA, Angular, Vue.
- Proibido como banco da aplicação: SQLite, H2, MongoDB, arquivo JSON (só em testes é livre).
- Toda biblioteca nova precisa ser justificada: avise para eu registrar no README com o motivo.
- Nada pode depender de recurso controlado por mim (imagem Docker própria, serviço hospedado, submódulo).

## Regras de ouro

- A correção da API é um script automático, tudo ou nada por item. Siga métodos, caminhos, nomes de
  campos, códigos HTTP e formatos **exatamente** como no enunciado.
- As tabelas de exemplo do enunciado foram conferidas pela banca: use-as como casos de teste literais.
- Códigos: dado inválido → 400; recurso inexistente → 404; regra de negócio → 409.
- Erro sempre como JSON `{ "message": "..." }`, sem stack trace.
- API, corpos e query params em **snake_case**; base `/api/v1`; caminhos sem barra no final.
- Valores calculados (valor de mercado, overall, patrimônio, dias restantes, % de multa, classificação)
  **nunca** são gravados no banco nem recalculados no frontend.

## Fluxo de trabalho

1. Antes de codar, apresente um plano curto e espere meu ok.
2. Trabalhe em passos pequenos. Ao fim de cada passo: rode lint, format:check e testes da pasta alterada.
3. Ao terminar um passo, **proponha** a mensagem de commit e pare. **Eu** faço o commit e o push.
4. Registre em `docs/ia.md` (uma linha por passo) o que foi gerado e o que eu pedi para mudar.

## Commits (eu executo, você só sugere)

- Conventional Commits em português, com escopo: `feat(players): calcula valor de mercado (RN02–RN05)`.
- Tipos: feat, fix, test, refactor, docs, chore, style, build.
- Cada commit altera uma coisa lógica e deixa o projeto compilando e com testes verdes.
- Proibido mensagem formada só por palavras genéricas: ajuste(s), alteração(ões), atualização(ões),
  change(s), commit, correção(ões), final, fix(es), misc, teste(s), test(s), update(s), versão, wip.
- Prefira commits que mexem só em `backend/` ou só em `frontend/`.

## Proibido

- Executar `git commit`, `git push`, `git push --force`, `git rebase` ou reescrever histórico.
- Deixar código comentado, código sem uso, `console.log` ou `print` (o barema conta arquivo por arquivo).
- Misturar idiomas em identificadores: código em inglês; textos da tela e mensagens de erro em português.
- Criar segredos reais no repositório; tudo por variável de ambiente, listada no `.env.example`.
- Apagar ou "simplificar" testes para fazê-los passar.

## Definição de pronto

Lint e format:check sem erros, testes verdes, regra coberta por teste que cita o código da regra
(ex.: `RN15`), e nenhum item do barema relacionado deixado para trás sem me avisar.