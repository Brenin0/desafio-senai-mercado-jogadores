import Decimal from 'decimal.js';

export const POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;
export type Position = (typeof POSITIONS)[number];

export const CONDITIONS = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const;
export type Condition = (typeof CONDITIONS)[number];

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export const ATTRIBUTE_NAMES: readonly (keyof PlayerAttributes)[] = [
  'pace',
  'shooting',
  'passing',
  'dribbling',
  'defending',
  'physical',
];

/** Jogador como está gravado: o overall e o valor de mercado não são gravados (RN05, RN06). */
export interface Player extends PlayerAttributes {
  id: number;
  name: string;
  position: Position;
  agility: number;
  age: number;
  condition: Condition;
  baseValue: Decimal;
  potential: number;
  clubId: number | null;
}
