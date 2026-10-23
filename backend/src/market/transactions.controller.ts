import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClubIdParam } from '../clubs/club-id.param';
import { ErrorResponseDto } from '../common/http/error-response.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { TransactionHistoryResponseDto } from './dto/transaction-history-response.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('Mercado')
@Controller('clubs')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get(':id/transactions')
  @ApiOkResponse({ type: TransactionHistoryResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'type ou player_id fora da forma aceita ou vazios',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Clube inexistente; jogador do filtro inexistente ou excluído',
  })
  history(
    @ClubIdParam() id: number,
    @Query() query: ListTransactionsQueryDto,
  ): Promise<TransactionHistoryResponseDto> {
    return this.transactions.history(id, query);
  }
}
