import Decimal from 'decimal.js';
import { evaluateSale, SaleEvaluation } from './sale';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Momento da venda do Meia Lua (2.3.2): 2026-11-05T16:40-03:00. */
const SALE_MOMENT = new Date('2026-11-05T19:40:00Z');

function sale(
  purchaseValue: string,
  marketValue: string,
  untilLoyaltyEnd: number,
) {
  const result: SaleEvaluation = evaluateSale({
    purchaseValue: new Decimal(purchaseValue),
    marketValue: new Decimal(marketValue),
    loyaltyUntil: new Date(SALE_MOMENT.getTime() + untilLoyaltyEnd),
    now: SALE_MOMENT,
  });
  return {
    remainingDays: result.remainingDays,
    penaltyRate: result.penaltyRate,
    penalty: result.penalty.toNumber(),
    profit: result.profit.toNumber(),
    commission: result.commission.toNumber(),
    credit: result.credit.toNumber(),
    contractStatus: result.contractStatus,
  };
}

describe('RN15 e RN16 – venda: multa por fidelidade, lucro, comissão e crédito', () => {
  it('a venda do Meia Lua (2.3.2): 116 dias, 17 h e 35 min → 117 dias, 10%, multa 4,00, comissão 0,30 e crédito 35,70', () => {
    const result = evaluateSale({
      purchaseValue: new Decimal('37.00'),
      marketValue: new Decimal('40.00'),
      loyaltyUntil: new Date('2027-03-02T13:15:00Z'),
      now: SALE_MOMENT,
    });

    expect({
      remainingDays: result.remainingDays,
      penaltyRate: result.penaltyRate,
      penalty: result.penalty.toNumber(),
      profit: result.profit.toNumber(),
      commission: result.commission.toNumber(),
      credit: result.credit.toNumber(),
      contractStatus: result.contractStatus,
    }).toEqual({
      remainingDays: 117,
      penaltyRate: 10,
      penalty: 4,
      profit: 3,
      commission: 0.3,
      credit: 35.7,
      contractStatus: 'RESCINDIDO',
    });
  });

  it.each([
    ['37.00', '40.00', 60 * DAY, 10, 4.0, 3.0, 0.3, 35.7, 'RESCINDIDO'],
    ['50.00', '42.50', 200 * DAY, 20, 8.5, -7.5, 0.0, 34.0, 'RESCINDIDO'],
    ['26.15', '30.00', 10 * DAY, 5, 1.5, 3.85, 0.39, 28.11, 'RESCINDIDO'],
    ['25.00', '25.00', -DAY, 0, 0.0, 0.0, 0.0, 25.0, 'ENCERRADO'],
    ['60.00', '75.00', 200 * DAY, 20, 10.0, 15.0, 2.0, 63.0, 'RESCINDIDO'],
  ])(
    'compra %s, venda %s: %i%% de multa → multa %d, lucro %d, comissão %d, crédito %d, contrato %s',
    (
      purchaseValue,
      marketValue,
      untilLoyaltyEnd,
      penaltyRate,
      penalty,
      profit,
      commission,
      credit,
      contractStatus,
    ) => {
      expect(sale(purchaseValue, marketValue, untilLoyaltyEnd)).toMatchObject({
        penaltyRate,
        penalty,
        profit,
        commission,
        credit,
        contractStatus,
      });
    },
  );

  it.each([
    [
      '30 dias, 6 h, 1 min e 29 s',
      30 * DAY + 6 * HOUR + MINUTE + 29_000,
      31,
      10,
    ],
    ['199 dias e 23 h 57 min', 199 * DAY + 23 * HOUR + 57 * MINUTE, 200, 20],
  ])(
    'ficha de exemplo: %s → %i dias e %i%% (arredondado para cima, nunca truncado)',
    (_, untilLoyaltyEnd, remainingDays, penaltyRate) => {
      expect(sale('37.00', '40.00', untilLoyaltyEnd)).toMatchObject({
        remainingDays,
        penaltyRate,
      });
    },
  );

  it('fidelidade que termina no próprio momento da venda: 0 dia, sem multa, contrato ENCERRADO', () => {
    expect(sale('37.00', '40.00', 0)).toMatchObject({
      remainingDays: 0,
      penaltyRate: 0,
      penalty: 0,
      contractStatus: 'ENCERRADO',
    });
  });
});
