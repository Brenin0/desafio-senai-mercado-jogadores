export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}
