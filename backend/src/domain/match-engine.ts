import Decimal from 'decimal.js';
import { Condition, Position } from './player';
import { compareRosterOrder } from './roster';
import { roundToInteger } from './rounding';

export type MatchCondition = Exclude<Condition, 'DOENTE'>;

export type DuelAttribute = 'shooting' | 'passing' | 'dribbling' | 'defending';

export type MatchOutcome = 'MANDANTE' | 'VISITANTE' | 'EMPATE';

export interface MatchPlayer {
  id: number;
  name: string;
  position: Position;
  condition: MatchCondition;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
}

export interface MatchTeam {
  clubId: number;
  players: MatchPlayer[];
}

export interface DuelSide {
  playerId: number;
  playerName: string;
  position: Position;
  condition: MatchCondition;
  attribute: DuelAttribute;
  value: number;
}

export interface Duel {
  order: number;
  attackingClubId: number;
  attacker: DuelSide;
  defender: DuelSide;
  goal: boolean;
}

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  result: MatchOutcome;
  duels: Duel[];
}

const POOR_CONDITION_FACTOR = new Decimal('0.85');

/**
 * Quem ataca e quem defende em cada ataque (RN20), pela posição na ordem do elenco:
 * 0 é o goleiro e 1 a 4 são os jogadores de linha, do mais recuado ao mais avançado.
 */
const DUEL_PAIRS = [
  { attacker: 4, defender: 0 },
  { attacker: 3, defender: 1 },
  { attacker: 2, defender: 2 },
];

/** RN20: titular MAL_CONDICIONADO joga com 15% a menos, inteiro com meio para cima. */
export function applyCondition(
  value: number,
  condition: MatchCondition,
): number {
  return condition === 'MAL_CONDICIONADO'
    ? roundToInteger(new Decimal(value).times(POOR_CONDITION_FACTOR))
    : value;
}

/** RN20: ATA usa finalização, MEI usa passe, e ZAG e LAT usam drible. */
function attackAttribute(position: Position): DuelAttribute {
  switch (position) {
    case 'ATA':
      return 'shooting';
    case 'MEI':
      return 'passing';
    default:
      return 'dribbling';
  }
}

function duelSide(player: MatchPlayer, attribute: DuelAttribute): DuelSide {
  return {
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    condition: player.condition,
    attribute,
    value: applyCondition(player[attribute], player.condition),
  };
}

/** Os 3 ataques de um time, numerados a partir de firstOrder. */
function attacks(
  attacking: MatchTeam,
  defending: MatchTeam,
  firstOrder: number,
): Duel[] {
  const attackers = [...attacking.players].sort(compareRosterOrder);
  const defenders = [...defending.players].sort(compareRosterOrder);
  return DUEL_PAIRS.map((pair, index) => {
    const attacker = attackers[pair.attacker];
    const attackerSide = duelSide(attacker, attackAttribute(attacker.position));
    const defenderSide = duelSide(defenders[pair.defender], 'defending');
    return {
      order: firstOrder + index,
      attackingClubId: attacking.clubId,
      attacker: attackerSide,
      defender: defenderSide,
      goal: attackerSide.value > defenderSide.value,
    };
  });
}

function outcome(homeGoals: number, awayGoals: number): MatchOutcome {
  if (homeGoals > awayGoals) {
    return 'MANDANTE';
  }
  if (homeGoals < awayGoals) {
    return 'VISITANTE';
  }
  return 'EMPATE';
}

/**
 * RN20: os 5 titulares de cada clube, na ordem do elenco, disputam 6 duelos: os 3 ataques do
 * mandante (1 a 3) e depois os 3 do visitante (4 a 6). É gol quando o ataque é maior que a defesa.
 */
export function playMatch(home: MatchTeam, away: MatchTeam): MatchResult {
  const homeAttacks = attacks(home, away, 1);
  const awayAttacks = attacks(away, home, 4);
  const homeGoals = homeAttacks.filter((duel) => duel.goal).length;
  const awayGoals = awayAttacks.filter((duel) => duel.goal).length;
  return {
    homeGoals,
    awayGoals,
    result: outcome(homeGoals, awayGoals),
    duels: [...homeAttacks, ...awayAttacks],
  };
}
