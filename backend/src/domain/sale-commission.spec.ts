import Decimal from 'decimal.js';
import { calculateCommission, settleSale } from './sale-commission';

describe('RN16 – comissão progressiva sobre o lucro (tabela de exemplos)', () => {
  it.each<[string, string]>([
    ['3.00', '0.30'],
    ['3.85', '0.39'],
    ['10.00', '1.00'],
    ['10.01', '1.00'],
    ['15.00', '2.00'],
    ['-7.50', '0.00'],
  ])('lucro %s → comissão %s', (profit, expected) => {
    expect(calculateCommission(new Decimal(profit)).toNumber()).toBe(
      Number(expected),
    );
  });
});

describe('RN16 – lucro, comissão e crédito no caixa (tabela de exemplos)', () => {
  it.each<[string, string, string, string, string, string]>([
    ['37.00', '40.00', '4.00', '3.00', '0.30', '35.70'],
    ['50.00', '42.50', '8.50', '-7.50', '0.00', '34.00'],
    ['26.15', '30.00', '1.50', '3.85', '0.39', '28.11'],
    ['25.00', '25.00', '0.00', '0.00', '0.00', '25.00'],
    ['60.00', '75.00', '10.00', '15.00', '2.00', '63.00'],
  ])(
    'compra %s, venda %s, multa %s → lucro %s, comissão %s, crédito %s',
    (purchaseValue, marketValue, penalty, profit, commission, credit) => {
      const sale = settleSale({
        purchaseValue: new Decimal(purchaseValue),
        marketValue: new Decimal(marketValue),
        penalty: new Decimal(penalty),
      });
      expect(sale.profit.toNumber()).toBe(Number(profit));
      expect(sale.commission.toNumber()).toBe(Number(commission));
      expect(sale.credit.toNumber()).toBe(Number(credit));
    },
  );
});
