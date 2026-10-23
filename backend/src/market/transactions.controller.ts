import { Controller, Get, Query, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
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

  @Get(':id/transactions/export')
  @ApiProduces('text/csv')
  @ApiOkResponse({
    description:
      'Histórico em CSV (RN18): UTF-8 sem BOM, separador ;, vírgula decimal e LF no fim de cada linha',
    schema: {
      type: 'string',
      example:
        'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n',
    },
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Filtro inválido; o erro sai em JSON',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description:
      'Clube inexistente; jogador do filtro inexistente ou excluído; o erro sai em JSON',
  })
  async exportCsv(
    @ClubIdParam() id: number,
    @Query() query: ListTransactionsQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const csv = await this.transactions.exportCsv(id, query);
    // Cabeçalhos do CSV só depois do service: numa recusa, o erro continua saindo em JSON.
    response.attachment(`historico-clube-${id}.csv`).type('text/csv');
    return csv;
  }
}
