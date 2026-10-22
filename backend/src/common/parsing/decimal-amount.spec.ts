import { parseDecimalAmount } from './decimal-amount';

describe('parseDecimalAmount (Filtros e query params)', () => {
  it.each([
    ['0', '0'],
    ['10', '10'],
    ['10.5', '10.5'],
    ['10.55', '10.55'],
    ['10.50', '10.5'],
    ['0.5', '0.5'],
    ['550', '550'],
  ])('aceita %s', (text, expected) => {
    expect(parseDecimalAmount(text)?.toString()).toBe(expected);
  });

  it.each([
    '',
    '-1',
    '+1',
    '00.5',
    '01',
    '.5',
    '10.',
    '10,5',
    '10.555',
    '1e2',
    ' 10',
    'abc',
  ])('recusa "%s"', (text) => {
    expect(parseDecimalAmount(text)).toBeNull();
  });
});
