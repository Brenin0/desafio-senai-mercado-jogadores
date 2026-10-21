import Decimal from 'decimal.js';
import { roundMoney, roundToInteger } from './rounding';

describe('Premissas – arredondamento de moedas: 2 casas, meio para longe do zero', () => {
  it.each([
    ['14.775', 14.78],
    ['0.385', 0.39],
    ['8.7875', 8.79],
    ['-14.775', -14.78],
  ])('%s → %s', (value, expected) => {
    expect(roundMoney(new Decimal(value)).toNumber()).toBe(expected);
  });
});

describe('RN06 – arredondamento para inteiro, meio para cima', () => {
  it.each([
    ['72.5', 73],
    ['72.49', 72],
  ])('%s → %s', (value, expected) => {
    expect(roundToInteger(new Decimal(value))).toBe(expected);
  });
});
