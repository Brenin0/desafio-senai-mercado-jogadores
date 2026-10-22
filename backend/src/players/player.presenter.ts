import { calculateMarketValue } from '../domain/market-value';
import { calculateOverall } from '../domain/overall';
import { Player } from '../domain/player';
import { PlayerResponseDto } from './dto/player-response.dto';

/**
 * Monta o jogador das respostas, com o overall pela posição atual (RN06) e o valor de mercado do
 * momento (RN02 a RN05). Usado por toda resposta que traz jogador.
 */
export function toPlayerResponse(player: Player): PlayerResponseDto {
  return {
    id: player.id,
    name: player.name,
    position: player.position,
    agility: player.agility,
    age: player.age,
    condition: player.condition,
    base_value: player.baseValue.toNumber(),
    market_value: calculateMarketValue(player).toNumber(),
    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
    potential: player.potential,
    overall: calculateOverall(player.position, player),
    club_id: player.clubId,
  };
}
