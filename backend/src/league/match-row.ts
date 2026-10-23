import { Prisma } from '@prisma/client';
import { Formation } from '../domain/lineup';
import { Match, MatchWithDuels } from '../domain/match';
import { Duel, DuelAttribute, MatchCondition } from '../domain/match-engine';
import { Position } from '../domain/player';

const CLUB_NAME_COLUMNS = { select: { id: true, name: true } };

/** Colunas lidas de `partidas`, com o nome dos dois clubes. */
export const MATCH_COLUMNS = {
  id: true,
  playedAt: true,
  homeGoals: true,
  awayGoals: true,
  homeFormation: true,
  awayFormation: true,
  homeClub: CLUB_NAME_COLUMNS,
  awayClub: CLUB_NAME_COLUMNS,
} satisfies Prisma.MatchSelect;

/** Colunas lidas de `duelos_partida`: tudo o que foi gravado no momento da partida. */
const DUEL_COLUMNS = {
  order: true,
  attackingClubId: true,
  attackerId: true,
  attackerName: true,
  attackerPosition: true,
  attackerCondition: true,
  attackAttribute: true,
  attackValue: true,
  defenderId: true,
  defenderName: true,
  defenderPosition: true,
  defenderCondition: true,
  defenseAttribute: true,
  defenseValue: true,
  goal: true,
} satisfies Prisma.MatchDuelSelect;

/** A partida com os 6 duelos, na ordem da RN20. */
export const MATCH_WITH_DUELS_COLUMNS = {
  ...MATCH_COLUMNS,
  duels: { select: DUEL_COLUMNS, orderBy: { order: 'asc' } },
} satisfies Prisma.MatchSelect;

type MatchRow = Prisma.MatchGetPayload<{ select: typeof MATCH_COLUMNS }>;
type MatchWithDuelsRow = Prisma.MatchGetPayload<{
  select: typeof MATCH_WITH_DUELS_COLUMNS;
}>;
type DuelRow = MatchWithDuelsRow['duels'][number];

/** Linha de `partidas` para a partida do domínio. */
export function toMatch(row: MatchRow): Match {
  return {
    id: row.id,
    playedAt: row.playedAt,
    home: {
      clubId: row.homeClub.id,
      clubName: row.homeClub.name,
      formation: row.homeFormation as Formation,
      goals: row.homeGoals,
    },
    away: {
      clubId: row.awayClub.id,
      clubName: row.awayClub.name,
      formation: row.awayFormation as Formation,
      goals: row.awayGoals,
    },
  };
}

function toDuel(row: DuelRow): Duel {
  return {
    order: row.order,
    attackingClubId: row.attackingClubId,
    attacker: {
      playerId: row.attackerId,
      playerName: row.attackerName,
      position: row.attackerPosition as Position,
      condition: row.attackerCondition as MatchCondition,
      attribute: row.attackAttribute as DuelAttribute,
      value: row.attackValue,
    },
    defender: {
      playerId: row.defenderId,
      playerName: row.defenderName,
      position: row.defenderPosition as Position,
      condition: row.defenderCondition as MatchCondition,
      attribute: row.defenseAttribute as DuelAttribute,
      value: row.defenseValue,
    },
    goal: row.goal,
  };
}

export function toMatchWithDuels(row: MatchWithDuelsRow): MatchWithDuels {
  return { ...toMatch(row), duels: row.duels.map(toDuel) };
}

/** Duelo jogado pelo motor para a linha de `duelos_partida`, com os valores do momento (RN20). */
export function toDuelData(
  duel: Duel,
): Prisma.MatchDuelUncheckedCreateWithoutMatchInput {
  return {
    order: duel.order,
    attackingClubId: duel.attackingClubId,
    attackerId: duel.attacker.playerId,
    attackerName: duel.attacker.playerName,
    attackerPosition: duel.attacker.position,
    attackerCondition: duel.attacker.condition,
    attackAttribute: duel.attacker.attribute,
    attackValue: duel.attacker.value,
    defenderId: duel.defender.playerId,
    defenderName: duel.defender.playerName,
    defenderPosition: duel.defender.position,
    defenderCondition: duel.defender.condition,
    defenseAttribute: duel.defender.attribute,
    defenseValue: duel.defender.value,
    goal: duel.goal,
  };
}
