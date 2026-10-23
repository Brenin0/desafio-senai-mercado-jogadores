import { ApiProperty } from '@nestjs/swagger';
import type { ContractStatus } from '../../domain/contract';
import { TransactionResponseDto } from './transaction-response.dto';

/** RN12: o contrato criado na compra. */
export class PurchaseContractDto {
  purchase_value!: number;
  @ApiProperty({ example: '2027-03-02T10:15:00-03:00' })
  loyalty_until!: string;
  status!: ContractStatus;
}

/** Resposta de POST /players/{id}/buy (2.3.1): a transação COMPRA, o contrato e o caixa novo. */
export class PurchaseResponseDto extends TransactionResponseDto {
  @ApiProperty({ type: () => PurchaseContractDto })
  contract!: PurchaseContractDto;

  club_cash!: number;
}
