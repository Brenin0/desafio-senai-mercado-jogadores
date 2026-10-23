import { MatchCondition } from './match-engine';
import { Condition, Player, Position } from './player';

export const FORMATIONS = ['3-1', '2-2', '2-1-1', '1-2-1'] as const;
export type Formation = (typeof FORMATIONS)[number];

/** RN19: 1 goleiro e 4 jogadores de linha. */
export const LINEUP_SIZE = 5;

/** Escalação como está gravada: a formação (nula enquanto o clube não escalou) e os titulares. */
export interface Lineup {
  formation: Formation | null;
  players: Player[];
}

interface Sectors {
  defense: number;
  midfield: number;
  attack: number;
}

/** RN19: jogadores de linha por setor, de trás para frente, sem o goleiro. */
export const FORMATION_SECTORS: Record<Formation, Sectors> = {
  '3-1': { defense: 3, midfield: 0, attack: 1 },
  '2-2': { defense: 2, midfield: 0, attack: 2 },
  '2-1-1': { defense: 2, midfield: 1, attack: 1 },
  '1-2-1': { defense: 1, midfield: 2, attack: 1 },
};

/**
 * RN19: as posições dos titulares fecham a formação com exatamente 1 GOL e, em cada setor,
 * a quantidade da tabela: defesa (ZAG ou LAT), meio (MEI) e ataque (ATA).
 */
export function fitsFormation(
  formation: Formation,
  positions: Position[],
): boolean {
  const count = (...sectorPositions: Position[]) =>
    positions.filter((position) => sectorPositions.includes(position)).length;
  const sectors = FORMATION_SECTORS[formation];
  return (
    count('GOL') === 1 &&
    count('ZAG', 'LAT') === sectors.defense &&
    count('MEI') === sectors.midfield &&
    count('ATA') === sectors.attack
  );
}

/** RN19 e RN20: jogador DOENTE não é escalado e não joga. */
export function canPlay<T extends { condition: Condition }>(
  player: T,
): player is T & { condition: MatchCondition } {
  return player.condition !== 'DOENTE';
}

/**
 * RN19 e RN20: completa com a formação salva e os 5 titulares. Titular vendido ou que passou a
 * DOENTE deixa a escalação incompleta, e o clube não joga até escalar de novo.
 */
export function isLineupComplete<
  T extends {
    formation: Formation | null;
    players: readonly { condition: Condition }[];
  },
>(lineup: T): lineup is T & { formation: Formation } {
  return (
    lineup.formation !== null &&
    lineup.players.filter(canPlay).length === LINEUP_SIZE
  );
}
