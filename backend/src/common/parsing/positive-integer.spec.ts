import { MAX_INTEGER, parsePositiveInteger } from './positive-integer';

describe('parsePositiveInteger (V8 e query params)', () => {
  it.each([
    ['1', 1],
    ['25', 25],
    ['2147483647', MAX_INTEGER],
  ])('aceita %s', (text, expected) => {
    expect(parsePositiveInteger(text)).toBe(expected);
  });

  it.each([
    'abc',
    '0',
    '-1',
    '+1',
    '1.5',
    '1.0',
    '01',
    '1e3',
    ' 1',
    '1 ',
    '',
    '2147483648',
    '99999999999999999999',
  ])('recusa "%s"', (text) => {
    expect(parsePositiveInteger(text)).toBeNull();
  });
});
