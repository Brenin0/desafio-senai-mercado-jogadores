import Decimal from 'decimal.js';
import { ActiveContract, ACTIVE_CONTRACT_STATUS } from '../domain/contract';
import { formatBrasiliaDateTime } from '../domain/datetime';
import { SaleEvaluation } from '../domain/sale';
import { summarizeTransactions, Transaction } from '../domain/transaction';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { TransactionHistoryResponseDto } from './dto/transaction-history-response.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

/** Transação das respostas, com os valores e o nome gravados no momento da operação (RN17). */
export function toTransactionResponse(
  transaction: Transaction,
): TransactionResponseDto {
  return {
    id: transaction.id,
    club_id: transaction.clubId,
    player_id: transaction.playerId,
    player_name: transaction.playerName,
    type: transaction.type,
    value: transaction.value.toNumber(),
    fee: transaction.fee.toNumber(),
    penalty: transaction.penalty.toNumber(),
    profit: transaction.profit && transaction.profit.toNumber(),
    cash_change: transaction.cashChange.toNumber(),
    created_at: formatBrasiliaDateTime(transaction.createdAt),
  };
}

/** Histórico do clube (2.3.3): as transações filtradas, na ordem recebida, e os totais delas. */
export function toTransactionHistoryResponse(
  transactions: Transaction[],
): TransactionHistoryResponseDto {
  const summary = summarizeTransactions(transactions);
  return {
    data: transactions.map(toTransactionResponse),
    summary: {
      total_spent: summary.totalSpent.toNumber(),
      total_received: summary.totalReceived.toNumber(),
      total_fees: summary.totalFees.toNumber(),
      total_penalties: summary.totalPenalties.toNumber(),
      total_profit: summary.totalProfit.toNumber(),
    },
  };
}

/** Resposta da venda (2.3.2): a transação VENDA, com o cálculo da multa e o caixa depois da venda. */
export function toSaleResponse(
  transaction: Transaction,
  sale: SaleEvaluation,
  purchaseValue: Decimal,
  clubCash: Decimal,
): SaleResponseDto {
  return {
    ...toTransactionResponse(transaction),
    purchase_value: purchaseValue.toNumber(),
    remaining_days: sale.remainingDays,
    penalty_rate: sale.penaltyRate,
    contract_status: sale.contractStatus,
    club_cash: clubCash.toNumber(),
  };
}

/** Resposta da compra (2.3.1): a transação COMPRA, o contrato ATIVO e o caixa depois da compra. */
export function toPurchaseResponse(
  transaction: Transaction,
  contract: ActiveContract,
  clubCash: Decimal,
): PurchaseResponseDto {
  return {
    ...toTransactionResponse(transaction),
    contract: {
      purchase_value: contract.purchaseValue.toNumber(),
      loyalty_until: formatBrasiliaDateTime(contract.loyaltyUntil),
      status: ACTIVE_CONTRACT_STATUS,
    },
    club_cash: clubCash.toNumber(),
  };
}
