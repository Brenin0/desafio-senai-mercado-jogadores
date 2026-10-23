import { formatBrasiliaDateTime } from '../domain/datetime';
import { Match, MatchSide, MatchWithDuels } from '../domain/match';
import { Duel, DuelSide, matchOutcome } from '../domain/match-engine';
import {
  DuelPlayerResponseDto,
  DuelResponseDto,
  MatchClubResponseDto,
  MatchResponseDto,
  MatchSummaryResponseDto,
} from './dto/match-response.dto';

function toMatchClubResponse(side: MatchSide): MatchClubResponseDto {
  return {
    club_id: side.clubId,
    club_name: side.clubName,
    formation: side.formation,
    goals: side.goals,
  };
}

function toDuelPlayerResponse(side: DuelSide): DuelPlayerResponseDto {
  return {
    player_id: side.playerId,
    player_name: side.playerName,
    position: side.position,
    condition: side.condition,
    attribute: side.attribute,
    value: side.value,
  };
}

function toDuelResponse(duel: Duel): DuelResponseDto {
  return {
    order: duel.order,
    attacking_club_id: duel.attackingClubId,
    attacker: toDuelPlayerResponse(duel.attacker),
    defender: toDuelPlayerResponse(duel.defender),
    goal: duel.goal,
  };
}

/** A partida como foi gravada; o result sai dos gols, pela mesma regra do motor (RN20). */
export function toMatchSummaryResponse(match: Match): MatchSummaryResponseDto {
  return {
    id: match.id,
    played_at: formatBrasiliaDateTime(match.playedAt),
    home: toMatchClubResponse(match.home),
    away: toMatchClubResponse(match.away),
    result: matchOutcome(match.home.goals, match.away.goals),
  };
}

/** A partida com os 6 duelos, na ordem da RN20 (2.4.2). */
export function toMatchResponse(match: MatchWithDuels): MatchResponseDto {
  return {
    ...toMatchSummaryResponse(match),
    duels: match.duels.map(toDuelResponse),
  };
}
