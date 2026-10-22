import { formatBrasiliaDateTime, parseBrasiliaDateTime } from './datetime';

describe('RN01 – entrada no formato AAAA-MM-DDTHH:MM-03:00', () => {
  it('2027-03-02T10:15-03:00 é o instante 2027-03-02T13:15Z', () => {
    expect(parseBrasiliaDateTime('2027-03-02T10:15-03:00')?.toISOString()).toBe(
      '2027-03-02T13:15:00.000Z',
    );
  });

  it.each([
    ['2028-02-29T10:15-03:00', '2028-02-29T13:15:00.000Z'],
    ['2027-12-31T23:59-03:00', '2028-01-01T02:59:00.000Z'],
    ['2027-01-01T00:00-03:00', '2027-01-01T03:00:00.000Z'],
  ])('%s é aceito', (text, expected) => {
    expect(parseBrasiliaDateTime(text)?.toISOString()).toBe(expected);
  });

  it.each([
    ['data inexistente', '2027-02-30T10:15-03:00'],
    ['hora inexistente', '2027-03-02T24:00-03:00'],
    ['sem o -03:00', '2027-03-02T10:15'],
    ['29 de fevereiro fora de ano bissexto', '2027-02-29T10:15-03:00'],
    ['minuto inexistente', '2027-03-02T10:60-03:00'],
    ['mês inexistente', '2027-13-02T10:15-03:00'],
    ['dia zero', '2027-03-00T10:15-03:00'],
    ['com segundos', '2027-03-02T10:15:00-03:00'],
    ['em UTC', '2027-03-02T13:15Z'],
    ['com outro fuso', '2027-03-02T10:15-02:00'],
    ['sem zero à esquerda', '2027-3-2T10:15-03:00'],
    ['texto vazio', ''],
  ])('%s (%s) é recusado', (_, text) => {
    expect(parseBrasiliaDateTime(text)).toBeNull();
  });
});

describe('RN01 – saída no formato AAAA-MM-DDTHH:MM:SS-03:00', () => {
  it.each([
    ['2026-11-05T19:40:00.000Z', '2026-11-05T16:40:00-03:00'],
    ['2027-03-02T13:15:00.000Z', '2027-03-02T10:15:00-03:00'],
    ['2026-11-06T01:30:00.000Z', '2026-11-05T22:30:00-03:00'],
    ['2027-01-01T02:59:59.999Z', '2026-12-31T23:59:59-03:00'],
  ])('%s → %s', (instant, expected) => {
    expect(formatBrasiliaDateTime(new Date(instant))).toBe(expected);
  });

  it('a data enviada na compra volta com os segundos: 2027-03-02T10:15-03:00 → 2027-03-02T10:15:00-03:00', () => {
    const loyaltyUntil = parseBrasiliaDateTime('2027-03-02T10:15-03:00');
    expect(loyaltyUntil && formatBrasiliaDateTime(loyaltyUntil)).toBe(
      '2027-03-02T10:15:00-03:00',
    );
  });
});
