import Decimal from 'decimal.js';
import { calculateMarketValue, MarketValueInput } from './market-value';

/** RN11: valor do elenco = soma dos valores de mercado dos jogadores do clube, a cada consulta. */
export function calculateSquadValue(players: MarketValueInput[]): Decimal {
  return players.reduce(
    (total, player) => total.plus(calculateMarketValue(player)),
    new Decimal(0),
  );
}

/** RN11: patrimônio = caixa + valor do elenco. */
export function calculateNetWorth(cash: Decimal, squadValue: Decimal): Decimal {
  return cash.plus(squadValue);
}
