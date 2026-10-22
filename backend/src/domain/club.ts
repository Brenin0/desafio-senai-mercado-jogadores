import Decimal from 'decimal.js';

/** RN10: o clube nasce com 300,00 em caixa, e a liga aceita no máximo 20 clubes. */
export const INITIAL_CLUB_CASH = new Decimal('300.00');
export const MAX_CLUBS = 20;

/** Clube como está gravado: valor do elenco e patrimônio não são gravados (RN11). */
export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: Decimal;
}
