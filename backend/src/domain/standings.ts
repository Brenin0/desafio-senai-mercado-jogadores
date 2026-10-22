import { compareByNameAndId } from './text';

export interface StandingClub {
  id: number;
  name: string;
}

export interface PlayedMatch {
  homeClubId: number;
  awayClubId: number;
  homeGoals: number;
  awayGoals: number;
}

export interface StandingRow {
  position: number;
  clubId: number;
  clubName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

type ClubRecord = Omit<StandingRow, 'position'>;

const WIN_POINTS = 3;
const DRAW_POINTS = 1;

function emptyRecord(club: StandingClub): ClubRecord {
  return {
    clubId: club.id,
    clubName: club.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function addResult(record: ClubRecord, scored: number, conceded: number): void {
  record.played += 1;
  record.goalsFor += scored;
  record.goalsAgainst += conceded;
  record.goalDifference = record.goalsFor - record.goalsAgainst;
  if (scored > conceded) {
    record.wins += 1;
    record.points += WIN_POINTS;
  } else if (scored === conceded) {
    record.draws += 1;
    record.points += DRAW_POINTS;
  } else {
    record.losses += 1;
  }
}

/** RN21: mais pontos, maior saldo, mais gols marcados e, por fim, o nome (Premissas). */
function compareStandings(a: ClubRecord, b: ClubRecord): number {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    compareByNameAndId(
      { id: a.clubId, name: a.clubName },
      { id: b.clubId, name: b.clubName },
    )
  );
}

/** RN21: classificação com todos os clubes, calculada a cada consulta a partir das partidas. */
export function calculateStandings(
  clubs: StandingClub[],
  matches: PlayedMatch[],
): StandingRow[] {
  const records = new Map(clubs.map((club) => [club.id, emptyRecord(club)]));
  for (const match of matches) {
    const home = records.get(match.homeClubId);
    const away = records.get(match.awayClubId);
    if (home && away) {
      addResult(home, match.homeGoals, match.awayGoals);
      addResult(away, match.awayGoals, match.homeGoals);
    }
  }
  return [...records.values()]
    .sort(compareStandings)
    .map((record, index) => ({ position: index + 1, ...record }));
}
