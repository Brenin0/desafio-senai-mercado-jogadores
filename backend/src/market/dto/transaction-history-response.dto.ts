import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from './transaction-response.dto';

/** RN17: totais das transações filtradas, com 2 casas; sem transações, todos 0,00. */
export class TransactionSummaryDto {
  total_spent!: number;
  total_received!: number;
  total_fees!: number;
  total_penalties!: number;
  total_profit!: number;
}

/** Resposta de GET /clubs/{id}/transactions (2.3.3). */
export class TransactionHistoryResponseDto {
  @ApiProperty({ type: () => [TransactionResponseDto] })
  data!: TransactionResponseDto[];

  @ApiProperty({ type: () => TransactionSummaryDto })
  summary!: TransactionSummaryDto;
}
