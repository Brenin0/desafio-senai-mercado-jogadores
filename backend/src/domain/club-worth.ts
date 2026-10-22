import Decimal from 'decimal.js';
import { calculateMarketValue, MarketValueInput } from './market-value';

export interface ClubWorth {
  squadValue: Decimal;
  netWorth: Decimal;
}

/**
 * RN11: valor do elenco = soma dos valores de mercado dos jogadores do clube; patrimônio = caixa +
 * valor do elenco. Calculados a cada consulta, nunca gravados.
 */
export function calculateClubWorth(
  cash: Decimal,
  players: MarketValueInput[],
): ClubWorth {
  const squadValue = players.reduce(
    (total, player) => total.plus(calculateMarketValue(player)),
    new Decimal(0),
  );
  return { squadValue, netWorth: cash.plus(squadValue) };
}
