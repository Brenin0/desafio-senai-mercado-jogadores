import { describe, expect, it } from 'vitest';
import { formatMoney } from './format.ts';

describe('formatMoney', () => {
  it.each([
    [37, '37,00'],
    [261.15, '261,15'],
    [0.5, '0,50'],
    [1234.5, '1.234,50'],
    [-3.15, '-3,15'],
  ])('mostra %d como %s', (value, expected) => {
    expect(formatMoney(value)).toBe(expected);
  });
});
