import type { ClosedContractStatus } from '../../domain/loyalty-penalty';
import { TransactionResponseDto } from './transaction-response.dto';

/**
 * Resposta de POST /players/{id}/sell (2.3.2): a transação VENDA, com o valor de compra, os dias
 * restantes, o percentual da multa, a situação do contrato e o caixa novo.
 */
export class SaleResponseDto extends TransactionResponseDto {
  purchase_value!: number;
  remaining_days!: number;
  penalty_rate!: number;
  contract_status!: ClosedContractStatus;
  club_cash!: number;
}
