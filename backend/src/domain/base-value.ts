import Decimal from 'decimal.js';
import { roundMoney } from './rounding';

export interface BaseValueInput {
  overall: number;
  potential: number;
  age: number;
}

/** Faixas progressivas da parte do overall (RN06); overall de até 40 não soma nada. */
const OVERALL_BANDS = [
  { from: 41, to: 60, valuePerPoint: new Decimal('0.50') },
  { from: 61, to: 75, valuePerPoint: new Decimal('2.00') },
  { from: 76, to: 99, valuePerPoint: new Decimal('6.00') },
];

const YOUNG_PROSPECT_MAX_AGE = 21;
const MIN_BASE_VALUE = new Decimal('1.00');

/** RN06: valor base, calculado uma única vez, no cadastro. */
export function calculateBaseValue({
  overall,
  potential,
  age,
}: BaseValueInput): Decimal {
  const overallPart = OVERALL_BANDS.reduce((total, band) => {
    const points = Math.max(0, Math.min(overall, band.to) - band.from + 1);
    return total.plus(band.valuePerPoint.times(points));
  }, new Decimal(0));

  const value =
    age <= YOUNG_PROSPECT_MAX_AGE
      ? overallPart.times(100 + potential - overall).dividedBy(100)
      : overallPart;

  return Decimal.max(roundMoney(value), MIN_BASE_VALUE);
}
