import Decimal from 'decimal.js';
import { formatMoney } from '../common/formatting/money';
import { MAX_SQUAD_SIZE } from '../domain/club';

export const LOYALTY_OUT_OF_RANGE =
  'loyalty_until deve ser depois do momento da compra e até 1.095 dias depois dele.';

export const PLAYER_NOT_FREE =
  'O jogador não está livre: já está no elenco de um clube.';

export const FREE_PLAYER_NOT_SELLABLE =
  'Jogador livre não pode ser vendido: ele não está no elenco de nenhum clube.';

export const REBUY_FORBIDDEN =
  'O clube não pode comprar um jogador que ele mesmo já vendeu.';

export const SQUAD_FULL = `O elenco já tem ${MAX_SQUAD_SIZE} jogadores, o máximo permitido.`;

export function costAboveLimitMessage(
  totalCost: Decimal,
  cashLimit: Decimal,
): string {
  return `O custo da compra (${formatMoney(totalCost)}) passa do limite de 50% do caixa (${formatMoney(cashLimit)}).`;
}
