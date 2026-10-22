import Decimal from 'decimal.js';
import { calculateClubWorth } from './club-worth';
import { Condition } from './player';

const player = (baseValue: string, condition: Condition = 'APTO') => ({
  baseValue: new Decimal(baseValue),
  condition,
  agility: 85,
  age: 25,
});

function worth(cash: string, players: ReturnType<typeof player>[]) {
  const { squadValue, netWorth } = calculateClubWorth(
    new Decimal(cash),
    players,
  );
  return { squadValue: squadValue.toNumber(), netWorth: netWorth.toNumber() };
}

describe('RN11 – valor do elenco e patrimônio', () => {
  it('clube sem jogadores: elenco 0,00 e patrimônio igual ao caixa de 300,00 (2.2.1)', () => {
    expect(worth('300.00', [])).toEqual({ squadValue: 0, netWorth: 300 });
  });

  it('Águias FC depois da compra (2.2.2): caixa 261,15, Meia Lua MAL_CONDICIONADO a 37,00 → patrimônio 298,15', () => {
    expect(worth('261.15', [player('40.00', 'MAL_CONDICIONADO')])).toEqual({
      squadValue: 37,
      netWorth: 298.15,
    });
  });

  it('o elenco soma os valores de mercado, não os valores base', () => {
    expect(
      worth('100.00', [
        player('40.00', 'MAL_CONDICIONADO'),
        player('9.50', 'MAL_CONDICIONADO'),
        player('82.00'),
      ]),
    ).toEqual({ squadValue: 127.79, netWorth: 227.79 });
  });

  it('ficha de exemplo: caixa 137,63 e elenco de 156,00 → patrimônio 293,63', () => {
    expect(worth('137.63', [player('100.00'), player('56.00')])).toEqual({
      squadValue: 156,
      netWorth: 293.63,
    });
  });
});
