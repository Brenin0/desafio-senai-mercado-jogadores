import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { Club } from '../domain/club';

/** Colunas lidas de `clubes`. */
export const CLUB_COLUMNS = {
  id: true,
  name: true,
  acronym: true,
  cash: true,
} satisfies Prisma.ClubSelect;

type ClubRow = Prisma.ClubGetPayload<{ select: typeof CLUB_COLUMNS }>;

/** Linha de `clubes` para o clube do domínio, com o caixa em decimal.js. */
export function toClub(row: ClubRow): Club {
  return { ...row, cash: new Decimal(row.cash.toString()) };
}
