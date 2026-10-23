import { formatMoney } from '../common/formatting/money';
import { formatBrasiliaDateTime } from '../domain/datetime';
import { Transaction } from '../domain/transaction';

const HEADER =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';
const NEEDS_QUOTES = /[;"]/;

/** RN18, item 6: nome com `;` ou aspas vai entre aspas duplas, com cada aspa interna duplicada. */
function csvText(text: string): string {
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvLine(transaction: Transaction): string {
  return [
    formatBrasiliaDateTime(transaction.createdAt),
    transaction.type,
    csvText(transaction.playerName),
    formatMoney(transaction.value),
    formatMoney(transaction.fee),
    formatMoney(transaction.penalty),
    transaction.profit ? formatMoney(transaction.profit) : '',
    formatMoney(transaction.cashChange),
  ].join(';');
}

/**
 * RN18: cabeçalho e uma linha por transação, na ordem recebida (a do histórico), separadas por `;`,
 * com vírgula decimal e `lucro` vazio quando nulo. Cada linha termina em LF, inclusive a última;
 * sem transações, só o cabeçalho.
 */
export function toTransactionsCsv(transactions: Transaction[]): string {
  return [HEADER, ...transactions.map(csvLine)]
    .map((line) => `${line}\n`)
    .join('');
}
