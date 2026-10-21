import Decimal from 'decimal.js';
import { evaluatePurchase } from './purchase-fee';

type Row = [string, string, string, string, string, boolean];

describe('RN13 – taxa de compra e limite de 50% do caixa', () => {
  it.each<Row>([
    ['300.00', '28.00', '0.00', '28.00', '150.00', true],
    ['300.00', '30.00', '0.00', '30.00', '150.00', true],
    ['300.00', '30.01', '1.50', '31.51', '150.00', true],
    ['100.00', '47.62', '2.38', '50.00', '50.00', true],
    ['100.00', '48.00', '2.40', '50.40', '50.00', false],
    ['261.15', '124.36', '6.22', '130.58', '130.575', false],
    ['261.15', '124.35', '6.22', '130.57', '130.575', true],
    ['300.00', '37.00', '1.85', '38.85', '150.00', true],
  ])(
    'caixa %s e valor de mercado %s → taxa %s, custo %s, limite %s, aceita: %s',
    (cash, marketValue, fee, totalCost, cashLimit, allowed) => {
      const purchase = evaluatePurchase({
        cash: new Decimal(cash),
        marketValue: new Decimal(marketValue),
      });
      expect(purchase.fee.toNumber()).toBe(Number(fee));
      expect(purchase.totalCost.toNumber()).toBe(Number(totalCost));
      expect(purchase.cashLimit.toNumber()).toBe(Number(cashLimit));
      expect(purchase.allowed).toBe(allowed);
    },
  );
});
