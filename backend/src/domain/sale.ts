import Decimal from 'decimal.js';
import {
  calculatePenalty,
  calculatePenaltyRate,
  calculateRemainingDays,
  ClosedContractStatus,
  closedContractStatus,
} from './loyalty-penalty';
import { settleSale } from './sale-commission';

export interface SaleEvaluationInput {
  purchaseValue: Decimal;
  marketValue: Decimal;
  loyaltyUntil: Date;
  now: Date;
}

export interface SaleEvaluation {
  remainingDays: number;
  penaltyRate: number;
  penalty: Decimal;
  profit: Decimal;
  commission: Decimal;
  credit: Decimal;
  contractStatus: ClosedContractStatus;
}

/**
 * RN15 e RN16: a venda pelo valor de mercado do momento, com a multa pelos dias restantes (as
 * mesmas funções da consulta do clube), o lucro sobre o valor de compra, a comissão e o crédito.
 */
export function evaluateSale({
  purchaseValue,
  marketValue,
  loyaltyUntil,
  now,
}: SaleEvaluationInput): SaleEvaluation {
  const remainingDays = calculateRemainingDays(loyaltyUntil, now);
  const penaltyRate = calculatePenaltyRate(remainingDays);
  const penalty = calculatePenalty(marketValue, penaltyRate);
  return {
    remainingDays,
    penaltyRate,
    penalty,
    ...settleSale({ purchaseValue, marketValue, penalty }),
    contractStatus: closedContractStatus(penalty),
  };
}
