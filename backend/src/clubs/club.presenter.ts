import { Club } from '../domain/club';
import { calculateNetWorth, calculateSquadValue } from '../domain/club-worth';
import { MarketValueInput } from '../domain/market-value';
import { ClubResponseDto } from './dto/club-response.dto';

/** Clube das respostas, com o valor do elenco e o patrimônio do momento (RN11). */
export function toClubResponse(
  club: Club,
  players: MarketValueInput[],
): ClubResponseDto {
  const squadValue = calculateSquadValue(players);
  return {
    id: club.id,
    name: club.name,
    acronym: club.acronym,
    cash: club.cash.toNumber(),
    squad_value: squadValue.toNumber(),
    net_worth: calculateNetWorth(club.cash, squadValue).toNumber(),
  };
}
