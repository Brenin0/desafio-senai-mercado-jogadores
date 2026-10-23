import Decimal from 'decimal.js';
import { MILLISECONDS_PER_DAY } from './datetime';
import { Player } from './player';

export const ACTIVE_CONTRACT_STATUS = 'ATIVO';

/** RN12: contrato criado na compra, com o valor de compra e o fim da fidelidade. */
export interface ActiveContract {
  purchaseValue: Decimal;
  loyaltyUntil: Date;
}

/** RN11: jogador do elenco, com o contrato ATIVO com o clube. */
export interface SquadMember {
  player: Player;
  contract: ActiveContract;
}

const MAX_LOYALTY_DAYS = 1095;

/**
 * Limites, `loyalty_until`: o fim da fidelidade é depois do momento da compra e até 1.095 dias
 * depois dele, inclusive (o fuso é sempre −03:00, então um dia tem sempre 24 horas).
 */
export function isLoyaltyUntilAllowed(loyaltyUntil: Date, now: Date): boolean {
  const remaining = loyaltyUntil.getTime() - now.getTime();
  return remaining > 0 && remaining <= MAX_LOYALTY_DAYS * MILLISECONDS_PER_DAY;
}
