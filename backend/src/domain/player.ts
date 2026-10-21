export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';

export type Condition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}
