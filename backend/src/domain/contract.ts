import Decimal from 'decimal.js';
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
