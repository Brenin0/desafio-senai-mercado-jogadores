import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { Transaction, TransactionType } from '../domain/transaction';

/** Colunas lidas de `transacoes`. */
export const TRANSACTION_COLUMNS = {
  id: true,
  clubId: true,
  playerId: true,
  playerName: true,
  type: true,
  value: true,
  fee: true,
  penalty: true,
  profit: true,
  cashChange: true,
  createdAt: true,
} satisfies Prisma.TransactionSelect;

type TransactionRow = Prisma.TransactionGetPayload<{
  select: typeof TRANSACTION_COLUMNS;
}>;

const toDecimal = (value: Prisma.Decimal) => new Decimal(value.toString());

/** Linha de `transacoes` para a transação do domínio, com os valores em decimal.js. */
export function toTransaction(row: TransactionRow): Transaction {
  return {
    ...row,
    type: row.type as TransactionType,
    value: toDecimal(row.value),
    fee: toDecimal(row.fee),
    penalty: toDecimal(row.penalty),
    profit: row.profit && toDecimal(row.profit),
    cashChange: toDecimal(row.cashChange),
  };
}
