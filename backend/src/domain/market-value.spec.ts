import Decimal from 'decimal.js';
import { calculateMarketValue } from './market-value';
import { Condition } from './player';

type Row = [string, Condition, number, number, string];

function marketValueOf([baseValue, condition, agility, age]: Row): number {
  return calculateMarketValue({
    baseValue: new Decimal(baseValue),
    condition,
    agility,
    age,
  }).toNumber();
}

describe('RN05 – valor de mercado (tabela de exemplos)', () => {
  it.each<Row>([
    ['82.00', 'APTO', 20, 25, '82.00'],
    ['82.00', 'APTO', 50, 19, '90.20'],
    ['82.00', 'MAL_CONDICIONADO', 50, 25, '69.70'],
    ['82.00', 'MAL_CONDICIONADO', 80, 21, '84.05'],
    ['82.00', 'MAL_CONDICIONADO', 30, 33, '53.30'],
    ['82.00', 'DOENTE', 90, 25, '69.70'],
    ['82.00', 'DOENTE', 30, 25, '49.20'],
    ['82.00', 'DOENTE', 10, 40, '49.20'],
    ['9.50', 'MAL_CONDICIONADO', 85, 25, '8.79'],
    ['1.00', 'MAL_CONDICIONADO', 50, 35, '1.00'],
  ])('valor base %s, %s, agilidade %i, %i anos → %s', (...row) => {
    expect(marketValueOf(row)).toBe(Number(row[4]));
  });
});

describe('RN05 – exemplos do Meia Lua (valor base 40,00, agilidade 85, 25 anos)', () => {
  it.each<Row>([
    ['40.00', 'MAL_CONDICIONADO', 85, 25, '37.00'],
    ['40.00', 'APTO', 85, 25, '40.00'],
  ])('valor base %s, %s, agilidade %i, %i anos → %s', (...row) => {
    expect(marketValueOf(row)).toBe(Number(row[4]));
  });
});

describe('RN03 e RN04 – limites das faixas de agilidade e de idade', () => {
  it.each<Row>([
    ['82.00', 'MAL_CONDICIONADO', 31, 25, '69.70'],
    ['82.00', 'MAL_CONDICIONADO', 79, 25, '69.70'],
    ['82.00', 'APTO', 50, 22, '82.00'],
    ['82.00', 'APTO', 50, 31, '82.00'],
    ['82.00', 'APTO', 50, 32, '73.80'],
  ])('valor base %s, %s, agilidade %i, %i anos → %s', (...row) => {
    expect(marketValueOf(row)).toBe(Number(row[4]));
  });
});
