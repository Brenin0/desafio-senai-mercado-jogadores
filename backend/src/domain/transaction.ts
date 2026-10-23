import Decimal from 'decimal.js';
import { roundMoney } from './rounding';

export const TRANSACTION_TYPES = ['COMPRA', 'VENDA'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Valores gravados na transação, no momento da operação (RN17). */
export interface TransactionValues {
  type: TransactionType;
  value: Decimal;
  fee: Decimal;
  penalty: Decimal;
  profit: Decimal | null;
  cashChange: Decimal;
}

/** Transação como está gravada: nunca é recalculada nem editada (RN17). */
export interface Transaction extends TransactionValues {
  id: number;
  clubId: number;
  playerId: number;
  playerName: string;
  createdAt: Date;
}

export interface TransactionSummary {
  totalSpent: Decimal;
  totalReceived: Decimal;
  totalFees: Decimal;
  totalPenalties: Decimal;
  totalProfit: Decimal;
}

function sum(values: Decimal[]): Decimal {
  return roundMoney(
    values.reduce((total, value) => total.plus(value), new Decimal(0)),
  );
}

/**
 * RN17: totais das transações filtradas. Gasto = valor + taxa das compras; recebido, multas e lucro
 * (com sinal) das vendas; taxas e comissões de todas.
 */
export function summarizeTransactions(
  transactions: TransactionValues[],
): TransactionSummary {
  const purchases = transactions.filter(({ type }) => type === 'COMPRA');
  const sales = transactions.filter(({ type }) => type === 'VENDA');
  return {
    totalSpent: sum(purchases.map(({ value, fee }) => value.plus(fee))),
    totalReceived: sum(sales.map(({ cashChange }) => cashChange)),
    totalFees: sum(transactions.map(({ fee }) => fee)),
    totalPenalties: sum(sales.map(({ penalty }) => penalty)),
    totalProfit: sum(sales.map(({ profit }) => profit ?? new Decimal(0))),
  };
}
