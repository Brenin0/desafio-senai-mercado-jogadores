import { Position } from './player';

export type Formation = '3-1' | '2-2' | '2-1-1' | '1-2-1';

interface Sectors {
  defense: number;
  midfield: number;
  attack: number;
}

/** RN19: jogadores de linha por setor, de trás para frente, sem o goleiro. */
const FORMATION_SECTORS: Record<Formation, Sectors> = {
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
