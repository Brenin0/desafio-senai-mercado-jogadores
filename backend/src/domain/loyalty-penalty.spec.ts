import Decimal from 'decimal.js';
import {
  calculatePenalty,
  calculatePenaltyRate,
  calculateRemainingDays,
  closedContractStatus,
} from './loyalty-penalty';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('RN15 – dias restantes e percentual da multa (tabela de exemplos)', () => {
  const saleMoment = new Date('2026-11-05T16:40:00-03:00');

  it.each<[string, number, number, number]>([
    ['já passou', 0, 0, -1 * DAY],
    ['10 dias e 2 horas', 11, 5, 10 * DAY + 2 * HOUR],
    ['exatamente 30 dias', 30, 5, 30 * DAY],
    ['30 dias e 1 minuto', 31, 10, 30 * DAY + MINUTE],
    ['exatamente 180 dias', 180, 10, 180 * DAY],
    ['180 dias e 1 minuto', 181, 20, 180 * DAY + MINUTE],
    ['200 dias', 200, 20, 200 * DAY],
  ])(
    'fim da fidelidade: %s → %i dias, multa de %i%%',
    (_, expectedDays, expectedRate, offset) => {
      const loyaltyUntil = new Date(saleMoment.getTime() + offset);
      const remainingDays = calculateRemainingDays(loyaltyUntil, saleMoment);
      expect(remainingDays).toBe(expectedDays);
      expect(calculatePenaltyRate(remainingDays)).toBe(expectedRate);
    },
  );

  it('fim da fidelidade no próprio momento da venda → 0 dias', () => {
    expect(calculateRemainingDays(saleMoment, saleMoment)).toBe(0);
  });

  it('fim da fidelidade daqui a 1 minuto → 1 dia, multa de 5% (início da faixa de 1 a 30)', () => {
    const loyaltyUntil = new Date(saleMoment.getTime() + MINUTE);
    const remainingDays = calculateRemainingDays(loyaltyUntil, saleMoment);
    expect(remainingDays).toBe(1);
    expect(calculatePenaltyRate(remainingDays)).toBe(5);
  });
});

describe('RN15 – exemplos do Meia Lua (fim da fidelidade em 2027-03-02T10:15-03:00)', () => {
  const loyaltyUntil = new Date('2027-03-02T10:15:00-03:00');

  it('venda em 2026-11-05T16:40-03:00: 116 dias, 17 h e 35 min → 117 dias, 10%', () => {
    const now = new Date('2026-11-05T16:40:00-03:00');
    const remainingDays = calculateRemainingDays(loyaltyUntil, now);
    expect(remainingDays).toBe(117);
    expect(calculatePenaltyRate(remainingDays)).toBe(10);
  });

  it('consulta do clube logo depois da compra, em 2026-11-02T10:15-03:00 → 120 dias, 10%', () => {
    const now = new Date('2026-11-02T10:15:00-03:00');
    const remainingDays = calculateRemainingDays(loyaltyUntil, now);
    expect(remainingDays).toBe(120);
    expect(calculatePenaltyRate(remainingDays)).toBe(10);
  });
});

describe('RN15 – multa: valor de mercado × percentual, arredondada e limitada a 10,00', () => {
  it.each<[string, number, string]>([
    ['40.00', 10, '4.00'],
    ['42.50', 20, '8.50'],
    ['30.00', 5, '1.50'],
    ['25.00', 0, '0.00'],
    ['75.00', 20, '10.00'],
    ['9.99', 5, '0.50'],
    ['50.00', 20, '10.00'],
  ])('valor %s com %i%% → multa %s', (marketValue, rate, expected) => {
    const penalty = calculatePenalty(new Decimal(marketValue), rate);
    expect(penalty.toNumber()).toBe(Number(expected));
  });
});

describe('RN15 – situação do contrato encerrado pela venda', () => {
  it('com multa → RESCINDIDO', () => {
    expect(closedContractStatus(new Decimal('4.00'))).toBe('RESCINDIDO');
  });

  it('sem multa (fidelidade cumprida) → ENCERRADO', () => {
    expect(closedContractStatus(new Decimal('0.00'))).toBe('ENCERRADO');
  });
});
