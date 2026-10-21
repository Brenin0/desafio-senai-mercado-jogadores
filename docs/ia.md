# Diário de uso de IA

Uma linha por passo: o que foi gerado e o que pedi para mudar. Base da seção "Uso de inteligência
artificial" do README.

| Data | Fase | Ferramenta | O que foi gerado | O que pedi para mudar |
| --- | --- | --- | --- | --- |
| 20/10/2026 | 0 · Leitura | Claude Code | `docs/checklist.md`: itens B01–B22 e F01–F14 com regras e casos-limite, pontos em aberto com proposta e divergências com o plano; `docs/desafio.md` renomeado para `docs/enunciado.md` | Nenhuma até aqui |
| 20/10/2026 | 1 · Passo 1 | Claude Code | `.gitignore` único na raiz e `docker-compose.yml` com `postgres:16-alpine` e healthcheck; porta 5433 no host, porque esta máquina já tem um PostgreSQL 17 na 5432 | Pedi um `.gitignore` |
| 20/10/2026 | 1 · Passo 2 | Claude Code | Esqueleto NestJS 11 em `backend/` (TypeScript strict, sem código de exemplo), prefixo `/api/v1`, CORS só para `FRONTEND_ORIGIN`, ambiente validado na subida, `.env.example`, scripts `lint` e `format:check`, testes unitários e e2e; ESLint atualizado para a 10; `.gitattributes` para forçar LF | Nenhuma |
| 20/10/2026 | 1 · Passo 3 | Claude Code | Filtro global que devolve sempre `{ message }` (rota inexistente, 409, 500 sem stack), middleware que troca o erro do parser por "JSON inválido", pipe que recusa corpo que não é objeto (V1), `ValidationPipe` global sem conversão implícita e que ignora campos desconhecidos; testes unitários e e2e. Corrigido na hora: o Nest repassava a mensagem crua do parser, em inglês | Nenhuma |
| 20/10/2026 | 1 · Passo 4 | Claude Code | Middleware de log com o Logger do Nest (contexto `HTTP`): uma linha por requisição ao fim da resposta, com método, caminho, status e duração; registrado antes do parser JSON para cobrir também as recusas do parser; testes unitários e e2e | Nenhuma |
| 20/10/2026 | 1 · Passo 5 | Claude Code | Swagger em `/api/docs` (documento OpenAPI em `/api/docs-json`) com `@nestjs/swagger` 11 e o plugin do Swagger ligado no build para documentar os DTOs das próximas fases; teste e2e | Nenhuma |
| 20/10/2026 | 1 · Passo 6 | Claude Code | Esqueleto Vite 8 `react-ts` em `frontend/` sem o código de exemplo; Oxlint do template trocado por ESLint 10 (typescript-eslint com checagem de tipos, react-hooks, react-refresh) + Prettier; Vitest com jsdom e Testing Library; porta 5173 fixa; `strict` explícito nos `tsconfig` | Nenhuma |
| 20/10/2026 | 1 · Passo 7 | Claude Code | Tailwind 4 (plugin do Vite), React Router 8 em modo biblioteca, layout com cabeçalho e menu (Jogadores em `/`, Clubes, Partidas, Classificação), páginas vazias por tela em `features/` e página de endereço inexistente; testes de navegação; conferido em 1366 px e 375 px | Nenhuma |
| 20/10/2026 | 1 · Passo 8 | Claude Code | Cliente HTTP em `src/api/http.ts` (origem de `VITE_API_URL` + `/api/v1`, erro com o `message` da API, falha de rede com mensagem própria), `QueryClient` do TanStack Query sem nova tentativa nas recusas 4xx e nas ações, `.env.example` do frontend; testes | Nenhuma |
