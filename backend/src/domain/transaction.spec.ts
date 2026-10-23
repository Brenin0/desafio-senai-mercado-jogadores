import Decimal from 'decimal.js';
import { summarizeTransactions, TransactionValues } from './transaction';

const MEIA_LUA_PURCHASE: TransactionValues = {
  type: 'COMPRA',
  value: new Decimal('37.00'),
  fee: new Decimal('1.85'),
  penalty: new Decimal('0.00'),
  profit: null,
  cashChange: new Decimal('-38.85'),
};

const MEIA_LUA_SALE: TransactionValues = {
  type: 'VENDA',
  value: new Decimal('40.00'),
  fee: new Decimal('0.30'),
  penalty: new Decimal('4.00'),
  profit: new Decimal('3.00'),
  cashChange: new Decimal('35.70'),
};

function totals(transactions: TransactionValues[]) {
  const summary = summarizeTransactions(transactions);
  return {
    totalSpent: summary.totalSpent.toNumber(),
    totalReceived: summary.totalReceived.toNumber(),
    totalFees: summary.totalFees.toNumber(),
    totalPenalties: summary.totalPenalties.toNumber(),
    totalProfit: summary.totalProfit.toNumber(),
  };
}

describe('RN17 – summary das transações filtradas', () => {
  it('compra e venda do Meia Lua, sem filtro (2.3.3): 38,85 / 35,70 / 2,15 / 4,00 / 3,00', () => {
    expect(totals([MEIA_LUA_SALE, MEIA_LUA_PURCHASE])).toEqual({
      totalSpent: 38.85,
      totalReceived: 35.7,
      totalFees: 2.15,
      totalPenalties: 4,
      totalProfit: 3,
    });
  });

  it('com type=VENDA, total_spent é 0,00 (2.3.3)', () => {
    expect(totals([MEIA_LUA_SALE])).toEqual({
      totalSpent: 0,
      totalReceived: 35.7,
      totalFees: 0.3,
      totalPenalties: 4,
      totalProfit: 3,
    });
  });

  it('sem transações, todos os totais são 0,00', () => {
    expect(totals([])).toEqual({
      totalSpent: 0,
      totalReceived: 0,
      totalFees: 0,
      totalPenalties: 0,
      totalProfit: 0,
    });
  });

  it('o lucro soma com sinal: 3,00 − 7,50 = −4,50', () => {
    const loss: TransactionValues = {
      type: 'VENDA',
      value: new Decimal('42.50'),
      fee: new Decimal('0.00'),
      penalty: new Decimal('8.50'),
      profit: new Decimal('-7.50'),
      cashChange: new Decimal('34.00'),
    };

    expect(totals([MEIA_LUA_SALE, loss])).toMatchObject({
      totalReceived: 69.7,
      totalPenalties: 12.5,
      totalProfit: -4.5,
    });
  });
});
