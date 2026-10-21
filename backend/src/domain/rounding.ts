import Decimal from 'decimal.js';

/** Moedas: 2 casas, com o meio arredondado para longe do zero (Premissas). */
export function roundMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Inteiro mais próximo, com o meio arredondado para cima (overall da RN06 e condição da RN20). */
export function roundToInteger(value: Decimal): number {
  return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}
