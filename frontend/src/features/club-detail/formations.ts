import type { Formation, Position } from '../../api/types.ts';

export interface LineupSlot {
  label: string;
  positions: Position[];
}

/** Quantidade de jogadores de linha por setor (defesa, meio, ataque), da tabela da RN19. */
const SECTOR_COUNTS: Record<Formation, [number, number, number]> = {
  '3-1': [3, 0, 1],
  '2-2': [2, 0, 2],
  '2-1-1': [2, 1, 1],
  '1-2-1': [1, 2, 1],
};

const SECTORS: LineupSlot[] = [
  { label: 'Defesa', positions: ['ZAG', 'LAT'] },
  { label: 'Meio', positions: ['MEI'] },
  { label: 'Ataque', positions: ['ATA'] },
];

export const FORMATIONS = Object.keys(SECTOR_COUNTS) as Formation[];

/** As 5 vagas da formação: o goleiro e os jogadores de linha de cada setor. */
export function lineupSlots(formation: Formation): LineupSlot[] {
  const slots: LineupSlot[] = [{ label: 'Goleiro (GOL)', positions: ['GOL'] }];
  SECTOR_COUNTS[formation].forEach((count, sectorIndex) => {
    const sector = SECTORS[sectorIndex];
    for (let number = 1; number <= count; number++) {
      slots.push({
        label: `${sector.label} ${number} (${sector.positions.join(' ou ')})`,
        positions: sector.positions,
      });
    }
  });
  return slots;
}
