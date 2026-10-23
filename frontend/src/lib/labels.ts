import type { Condition, Position } from '../api/types.ts';

export const POSITION_LABELS: Record<Position, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campista',
  ATA: 'Atacante',
};

export const CONDITION_LABELS: Record<Condition, string> = {
  APTO: 'Apto',
  MAL_CONDICIONADO: 'Mal condicionado',
  DOENTE: 'Doente',
};

export const POSITIONS = Object.keys(POSITION_LABELS) as Position[];

export const CONDITIONS = Object.keys(CONDITION_LABELS) as Condition[];

export const ATTRIBUTE_LABELS: Record<string, string> = {
  pace: 'Velocidade',
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  defending: 'Defesa',
  physical: 'Físico',
};
