import Decimal from 'decimal.js';
import { ActiveContract, ACTIVE_CONTRACT_STATUS } from '../domain/contract';
import { formatBrasiliaDateTime } from '../domain/datetime';
import { Transaction } from '../domain/transaction';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
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
