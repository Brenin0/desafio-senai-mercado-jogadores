import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { Condition, Player, Position } from '../domain/player';

/** Colunas lidas de `jogadores`; as datas de controle ficam de fora. */
export const PLAYER_COLUMNS = {
  id: true,
  name: true,
  position: true,
  agility: true,
  age: true,
  condition: true,
  baseValue: true,
  clubId: true,
  pace: true,
  shooting: true,
  passing: true,
  dribbling: true,
  defending: true,
  physical: true,
  potential: true,
} satisfies Prisma.PlayerSelect;

type PlayerRow = Prisma.PlayerGetPayload<{ select: typeof PLAYER_COLUMNS }>;

/** Linha de `jogadores` para o jogador do domínio, com o valor base em decimal.js. */
export function toPlayer(row: PlayerRow): Player {
  return {
    ...row,
    position: row.position as Position,
    condition: row.condition as Condition,
    baseValue: new Decimal(row.baseValue.toString()),
  };
}
