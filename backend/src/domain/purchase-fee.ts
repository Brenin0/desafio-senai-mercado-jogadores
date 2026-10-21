import Decimal from 'decimal.js';
import { roundMoney } from './rounding';

export interface PurchaseInput {
  cash: Decimal;
  marketValue: Decimal;
}

export interface PurchaseEvaluation {
  fee: Decimal;
  totalCost: Decimal;
  cashLimit: Decimal;
  allowed: boolean;
}

const FEE_RATE = new Decimal('0.05');
const FEE_FREE_UP_TO = new Decimal('30.00');

/**
 * RN13: taxa de 5% só quando o valor de mercado passa de 30,00; o custo total (valor + taxa)
 * pode chegar a 50% do caixa antes da compra, sem arredondar esse limite.
 */
export function evaluatePurchase({
  cash,
  marketValue,
}: PurchaseInput): PurchaseEvaluation {
  const fee = marketValue.greaterThan(FEE_FREE_UP_TO)
    ? roundMoney(marketValue.times(FEE_RATE))
    : new Decimal(0);
  const totalCost = marketValue.plus(fee);
  const cashLimit = cash.dividedBy(2);
  return {
    fee,
    totalCost,
    cashLimit,
    allowed: totalCost.lessThanOrEqualTo(cashLimit),
  };
}
