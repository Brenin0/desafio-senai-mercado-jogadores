# Diário de uso de IA

Uma linha por passo: o que foi gerado e o que pedi para mudar. Base da seção "Uso de inteligência
artificial" do README.

| Data | Fase | Ferramenta | O que foi gerado | O que pedi para mudar |
| --- | --- | --- | --- | --- |
| 20/10/2026 | 0 · Leitura | Claude Code | `docs/checklist.md`: itens B01–B22 e F01–F14 com regras e casos-limite, pontos em aberto com proposta e divergências com o plano; `docs/desafio.md` renomeado para `docs/enunciado.md` | Nenhuma até aqui |
| 20/10/2026 | 1 · Passo 1 | Claude Code | `.gitignore` único na raiz e `docker-compose.yml` com `postgres:16-alpine` e healthcheck; porta 5433 no host, porque esta máquina já tem um PostgreSQL 17 na 5432 | Pedi um `.gitignore` |
| 20/10/2026 | 1 · Passo 2 | Claude Code | Esqueleto NestJS 11 em `backend/` (TypeScript strict, sem código de exemplo), prefixo `/api/v1`, CORS só para `FRONTEND_ORIGIN`, ambiente validado na subida, `.env.example`, scripts `lint` e `format:check`, testes unitários e e2e; ESLint atualizado para a 10; `.gitattributes` para forçar LF | Nenhuma |
| 20/10/2026 | 1 · Passo 3 | Claude Code | Filtro global que devolve sempre `{ message }` (rota inexistente, 409, 500 sem stack), middleware que troca o erro do parser por "JSON inválido", pipe que recusa corpo que não é objeto (V1), `ValidationPipe` global sem conversão implícita e que ignora campos desconhecidos; testes unitários e e2e. Corrigido na hora: o Nest repassava a mensagem crua do parser, em inglês | Nenhuma |
