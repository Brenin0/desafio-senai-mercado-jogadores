# CLAUDE.md — frontend

Leia também o `CLAUDE.md` da raiz. Requisitos na seção "🖥️ Frontend" de `docs/enunciado.md`; pontuação
em `docs/barema.md` (F1, F2, F3, F5). Mockup de referência: `docs/mockup-tela-inicial.png` (fidelidade
visual não conta ponto; fluxo e informações contam).

## Stack

React 19 + Vite (`react-ts`), TypeScript strict, React Router (modo biblioteca), TanStack Query,
React Hook Form (com as regras de validação próprias dele, sem Zod), Tailwind CSS, Vitest + Testing Library. Gerenciador: npm.
A origem da API vem de `VITE_API_URL` (listada no `.env.example`).

## Estrutura

```
src/
├── api/          cliente HTTP e funções por recurso (players, clubs, market, league) — ÚNICO lugar com fetch
├── hooks/        hooks do TanStack Query (useQuery/useMutation) que usam src/api
├── components/   compartilhados: DataTable, FormField, Feedback, ConfirmDialog, Pagination, Money, DateTime
├── features/     uma pasta por tela: players, clubs, club-detail, matches, standings
├── lib/          formatação de moeda e data, conversão de data digitada para -03:00
└── routes.tsx
```

## Regras que valem ponto (F2 e F3)

- **Nenhum `fetch` ou Axios dentro de componente.** Componentes usam hooks de `src/hooks`.
- Uma única tabela compartilhada (`DataTable`) com estados de **carregamento, lista vazia e erro**,
  usada pelas 6 telas de lista: jogadores, clubes, elenco, histórico de transações, histórico de
  partidas, classificação. Nenhuma tela monta tabela própria.
- Um único `FormField` (rótulo, campo e mensagem de erro) e um único `Feedback` (sucesso e erro).
- **Nunca recalcular** o que a API devolve: valor base, valor de mercado, overall, taxa, multa,
  comissão, lucro, crédito, valor do elenco, patrimônio, dias restantes, % de multa, totais do summary,
  placar, duelos, classificação. Exceção permitida: custo total = valor + taxa.
- **Nunca reordenar** listas da API: clubes, elenco, histórico, partidas e classificação aparecem na
  ordem devolvida.
- Depois de cada uma das 9 ações (cadastrar, editar, alterar condição, excluir, criar clube, comprar,
  vender, escalar, jogar partida): mostrar sucesso, invalidar as queries afetadas e exibir os dados novos
  sem recarregar a página.
- Em recusa, mostrar o `message` devolvido pela API, nunca texto genérico.
- Botão de envio desabilitado enquanto o pedido está em andamento: clique duplo = um único pedido.
- Os 7 formulários (cadastro, edição, condição, clube, compra, escalação, partida) validam antes de
  enviar os obrigatórios e os limites de um campo, com a mensagem junto ao campo:
  nome do jogador 3–100, nome do clube 3–60, sigla 3 letras, agilidade 1–100, idade 16–45,
  atributos e potencial 1–99; na escalação, formação e um titular em cada uma das 5 vagas;
  na partida, mandante e visitante.
- Regras que dependem do banco ficam na API: enviar o pedido e mostrar o `message`.

## Apresentação

- Moeda: 2 casas e vírgula decimal (`Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 })`).
- Datas exibidas no horário de Brasília (`timeZone: 'America/Sao_Paulo'`).
- Data digitada (fim da fidelidade) interpretada em Brasília e enviada como `AAAA-MM-DDTHH:MM-03:00`.
- Variação do caixa no histórico com sinal: "+" entrada, "-" saída.
- Clube do jogador: nome ou sigla; "Livre" quando `club_id` é nulo.
- Escalação incompleta: aviso de que o clube não pode jogar.
- Resultado da partida: placar e os 6 duelos (atacante, defensor, atributos, valores, gol).
- Layout utilizável em 375 px sem rolagem horizontal da página (tabelas rolam dentro do próprio quadro).
- Textos da tela em português; identificadores em inglês (camelCase, componentes em PascalCase).

## Testes e comandos

```
npm run lint          # ESLint, sem erros
npm run format:check  # Prettier, só verifica
npm test              # vitest run (sem watch)
npm run build
npm run dev           # http://localhost:5173
```