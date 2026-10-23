import { StandingRow } from '../domain/standings';
import { StandingResponseDto } from './dto/standing-response.dto';

/** Linha da classificação (RN21), na ordem e com os valores calculados pelo domínio. */
export function toStandingResponse(row: StandingRow): StandingResponseDto {
  return {
    position: row.position,
    club_id: row.clubId,
    club_name: row.clubName,
    played: row.played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goals_for: row.goalsFor,
    goals_against: row.goalsAgainst,
    goal_difference: row.goalDifference,
    points: row.points,
  };
}
