import { isLineupComplete, Lineup } from '../domain/lineup';
import { compareRosterOrder } from '../domain/roster';
import { toPlayerResponse } from '../players/player.presenter';
import { LineupResponseDto } from './dto/lineup-response.dto';

/** RN19: a escalação com os titulares na ordem do elenco (RN11), cada um como em GET /players/{id}. */
export function toLineupResponse(
  clubId: number,
  lineup: Lineup,
): LineupResponseDto {
  return {
    club_id: clubId,
    formation: lineup.formation,
    complete: isLineupComplete(lineup),
    players: [...lineup.players].sort(compareRosterOrder).map(toPlayerResponse),
  };
}
