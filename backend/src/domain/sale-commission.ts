import Decimal from 'decimal.js';
import { roundMoney } from './rounding';

export interface SaleInput {
  purchaseValue: Decimal;
  marketValue: Decimal;
  penalty: Decimal;
}

export interface SaleSettlement {
  profit: Decimal;
  commission: Decimal;
  credit: Decimal;
}

const FIRST_TIER_LIMIT = new Decimal('10.00');
const FIRST_TIER_RATE = new Decimal('0.10');
const SECOND_TIER_RATE = new Decimal('0.20');

/**
 * RN16: 10% sobre a parte do lucro até 10,00 mais 20% sobre a parte acima, arredondada
 * uma única vez no final; sem lucro, 0,00.
 */
export function calculateCommission(profit: Decimal): Decimal {
  if (profit.lessThanOrEqualTo(0)) {
    return new Decimal(0);
  }
  const firstTier = Decimal.min(profit, FIRST_TIER_LIMIT);
  const secondTier = Decimal.max(profit.minus(FIRST_TIER_LIMIT), 0);
  return roundMoney(
    firstTier.times(FIRST_TIER_RATE).plus(secondTier.times(SECOND_TIER_RATE)),
  );
}

/**
 * RN16: lucro = valor de mercado na venda − valor de compra (sem a taxa);
 * crédito no caixa = valor de mercado − multa (RN15) − comissão.
 */
export function settleSale({
  purchaseValue,
  marketValue,
  penalty,
}: SaleInput): SaleSettlement {
  const profit = marketValue.minus(purchaseValue);
  const commission = calculateCommission(profit);
  const credit = marketValue.minus(penalty).minus(commission);
  return { profit, commission, credit };
}
