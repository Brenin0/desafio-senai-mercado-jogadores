import { describe, expect, it } from 'vitest';
import { formatDateTime, formatMoney } from './format.ts';

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

describe('formatDateTime', () => {
  it('mostra a data da API no horário de Brasília', () => {
    expect(formatDateTime('2027-03-02T10:15:00-03:00')).toBe(
      '02/03/2027 10:15',
    );
  });

  it('converte para Brasília um instante em outro fuso', () => {
    expect(formatDateTime('2026-11-02T13:15:00Z')).toBe('02/11/2026 10:15');
    expect(formatDateTime('2026-11-03T02:30:00Z')).toBe('02/11/2026 23:30');
  });
});
