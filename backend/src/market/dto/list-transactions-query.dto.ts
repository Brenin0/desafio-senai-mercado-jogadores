import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import {
  IsQueryInteger,
  IsQueryList,
} from '../../common/validators/query.validators';
import { TRANSACTION_TYPES } from '../../domain/transaction';

/**
 * Query params do histórico e da exportação (RN17 e RN18). Presente e vazio, ou fora da forma
 * aceita, é recusado com 400; nome fora da tabela é ignorado.
 */
export class ListTransactionsQueryDto {
  @ApiPropertyOptional({
    description: `Um ou mais tipos, separados por vírgula, sem espaços e sem repetição: ${TRANSACTION_TYPES.join(', ')}`,
    example: 'COMPRA,VENDA',
  })
  @IsOptional()
  @IsQueryList(TRANSACTION_TYPES)
  type?: string;

  @IsOptional()
  @IsQueryInteger()
  player_id?: number;
}
