import Decimal from 'decimal.js';
import { calculateNetWorth, calculateSquadValue } from './club-worth';
import { Condition } from './player';

const player = (baseValue: string, condition: Condition = 'APTO') => ({
  baseValue: new Decimal(baseValue),
  condition,
  agility: 85,
  age: 25,
});

describe('RN11 – valor do elenco e patrimônio', () => {
  it('clube sem jogadores: elenco 0,00 e patrimônio igual ao caixa de 300,00 (2.2.1)', () => {
    const squadValue = calculateSquadValue([]);

    expect(squadValue.toNumber()).toBe(0);
    expect(
      calculateNetWorth(new Decimal('300.00'), squadValue).toNumber(),
    ).toBe(300);
  });

  it('Águias FC depois da compra (2.2.2): caixa 261,15, Meia Lua MAL_CONDICIONADO a 37,00 → patrimônio 298,15', () => {
    const squadValue = calculateSquadValue([
      player('40.00', 'MAL_CONDICIONADO'),
    ]);

    expect(squadValue.toNumber()).toBe(37);
    expect(
      calculateNetWorth(new Decimal('261.15'), squadValue).toNumber(),
    ).toBe(298.15);
  });

  it('o elenco soma os valores de mercado, não os valores base', () => {
    const squadValue = calculateSquadValue([
      player('40.00', 'MAL_CONDICIONADO'),
      player('9.50', 'MAL_CONDICIONADO'),
      player('82.00'),
    ]);

    expect(squadValue.toNumber()).toBe(127.79);
  });

  it('ficha de exemplo: caixa 137,63 e elenco 156,00 → patrimônio 293,63', () => {
    expect(
      calculateNetWorth(
        new Decimal('137.63'),
        new Decimal('156.00'),
      ).toNumber(),
    ).toBe(293.63);
  });
});
