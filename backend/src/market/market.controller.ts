import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/http/error-response.dto';
import { PlayerIdParam } from '../players/player-id.param';
import { BuyPlayerDto } from './dto/buy-player.dto';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
import { MarketService } from './market.service';

@ApiTags('Mercado')
@Controller('players')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Post(':id/buy')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PurchaseResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'club_id ou loyalty_until ausentes ou inválidos; fim da fidelidade fora do formato, que não é futuro ou passa de 1.095 dias',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Jogador inexistente ou excluído; clube inexistente',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description:
      'Jogador que não está livre; recompra pelo clube que o vendeu; elenco com 12 jogadores; custo acima de 50% do caixa',
  })
  buy(
    @PlayerIdParam() id: number,
    @Body() body: BuyPlayerDto,
  ): Promise<PurchaseResponseDto> {
    return this.market.buy(id, body);
  }
}
