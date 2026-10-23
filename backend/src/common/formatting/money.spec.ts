import Decimal from 'decimal.js';
import { formatMoney } from './money';

describe('formatMoney (RN18: 2 casas e vírgula decimal, negativo com -)', () => {
  it.each([
    ['40', '40,00'],
    ['0.3', '0,30'],
    ['-38.85', '-38,85'],
    ['0', '0,00'],
    ['1234.5', '1234,50'],
    ['130.575', '130,575'],
  ])('%s → %s', (value, text) => {
    expect(formatMoney(new Decimal(value))).toBe(text);
  });
});
