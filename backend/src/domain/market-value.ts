import Decimal from 'decimal.js';
import { Condition } from './player';
import { roundMoney } from './rounding';

export interface MarketValueInput {
  baseValue: Decimal;
  condition: Condition;
  agility: number;
  age: number;
}

/** RN02: desconto por condição física, em pontos percentuais. */
const CONDITION_DISCOUNT: Record<Condition, number> = {
  APTO: 0,
  MAL_CONDICIONADO: 15,
  DOENTE: 30,
};

const MAX_TOTAL_DISCOUNT = new Decimal(-40);
const MIN_MARKET_VALUE = new Decimal('1.00');

/** RN02 e RN03: a agilidade só altera o desconto de quem não está APTO. */
function conditionDiscount(condition: Condition, agility: number): Decimal {
  const discount = new Decimal(CONDITION_DISCOUNT[condition]);
  if (condition === 'APTO') {
    return discount;
  }
  if (agility >= 80) {
    return discount.dividedBy(2);
  }
  if (agility <= 30) {
    return discount.plus(10);
  }
  return discount;
}

/** RN04: ajuste pela idade atual, em pontos percentuais. */
function ageAdjustment(age: number): number {
  if (age <= 21) {
    return 10;
  }
  if (age >= 32) {
    return -10;
  }
  return 0;
}

/** RN05: valor de mercado, calculado a cada consulta a partir do valor base. */
export function calculateMarketValue({
  baseValue,
  condition,
  agility,
  age,
}: MarketValueInput): Decimal {
  const totalPercentage = Decimal.max(
    new Decimal(ageAdjustment(age)).minus(
      conditionDiscount(condition, agility),
    ),
    MAX_TOTAL_DISCOUNT,
  );
  const value = roundMoney(
    baseValue.times(totalPercentage.plus(100)).dividedBy(100),
  );
  return Decimal.max(value, MIN_MARKET_VALUE);
}
