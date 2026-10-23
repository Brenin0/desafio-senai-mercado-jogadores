import { isLoyaltyUntilAllowed } from './contract';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const DAY = 24 * 60 * MINUTE;

describe('Limites, loyalty_until: depois do momento da compra e até 1.095 dias depois dele', () => {
  const now = new Date('2026-11-02T13:15:30.500Z');
  const at = (offset: number) => new Date(now.getTime() + offset);

  it.each([
    ['1 minuto depois', MINUTE, true],
    ['exatamente 1.095 dias depois', 1095 * DAY, true],
    ['1.095 dias e 1 milissegundo depois', 1095 * DAY + 1, false],
    ['o próprio momento da compra', 0, false],
    ['1 minuto antes', -MINUTE, false],
  ])('%s → %p', (_, offset, allowed) => {
    expect(isLoyaltyUntilAllowed(at(offset), now)).toBe(allowed);
  });

  it('o minuto atual já passou: 10:15 é recusado às 10:15:30', () => {
    expect(isLoyaltyUntilAllowed(new Date('2026-11-02T13:15:00Z'), now)).toBe(
      false,
    );
  });

  it('agora + 1.095 dias, no minuto truncado, é aceito', () => {
    expect(
      isLoyaltyUntilAllowed(new Date(at(1095 * DAY).setUTCSeconds(0, 0)), now),
    ).toBe(true);
  });

  it('a compra de 2.3.1: em 02/11/2026 às 10:15, fidelidade até 02/03/2027 às 10:15', () => {
    expect(
      isLoyaltyUntilAllowed(
        new Date('2027-03-02T13:15:00Z'),
        new Date('2026-11-02T13:15:00Z'),
      ),
    ).toBe(true);
  });
});
