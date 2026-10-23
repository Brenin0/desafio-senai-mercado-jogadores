import Decimal from 'decimal.js';
import { MILLISECONDS_PER_DAY } from './datetime';
import { roundMoney } from './rounding';

export type ClosedContractStatus = 'ENCERRADO' | 'RESCINDIDO';

const MAX_PENALTY = new Decimal('10.00');

/**
 * RN15: dias até o fim da fidelidade, com fração arredondada para cima; 0 se já passou.
 * Usado na venda e na consulta do clube (RN11).
 */
export function calculateRemainingDays(loyaltyUntil: Date, now: Date): number {
  const remaining = loyaltyUntil.getTime() - now.getTime();
  return remaining > 0 ? Math.ceil(remaining / MILLISECONDS_PER_DAY) : 0;
}

/** RN15: percentual da multa pelos dias restantes. */
export function calculatePenaltyRate(remainingDays: number): number {
  if (remainingDays <= 0) {
    return 0;
  }
  if (remainingDays <= 30) {
    return 5;
  }
  if (remainingDays <= 180) {
    return 10;
  }
  return 20;
}

/** RN15: multa = valor de mercado × percentual, arredondada e limitada a 10,00. */
export function calculatePenalty(
  marketValue: Decimal,
  penaltyRate: number,
): Decimal {
  const penalty = roundMoney(marketValue.times(penaltyRate).dividedBy(100));
  return Decimal.min(penalty, MAX_PENALTY);
}

/** RN15: com multa o contrato é rescindido; sem multa (fidelidade cumprida), encerrado. */
export function closedContractStatus(penalty: Decimal): ClosedContractStatus {
  return penalty.greaterThan(0) ? 'RESCINDIDO' : 'ENCERRADO';
}
