import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClubIdParam } from '../clubs/club-id.param';
import { ErrorResponseDto } from '../common/http/error-response.dto';
import { LineupResponseDto } from './dto/lineup-response.dto';
import { SetLineupDto } from './dto/set-lineup.dto';
import { LineupService } from './lineup.service';

@ApiTags('Liga')
@Controller('clubs')
export class LineupController {
  constructor(private readonly lineups: LineupService) {}

  @Put(':id/lineup')
  @ApiOkResponse({
    type: LineupResponseDto,
    description: 'Escalação substituída por inteiro; o caixa não muda',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'formation ausente ou fora da lista; player_ids ausente, que não é lista, sem exatamente 5 ids, com ids repetidos ou que não são inteiros positivos',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Clube inexistente; jogador inexistente ou excluído',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description:
      'Jogador fora do elenco do clube; jogador DOENTE; posições que não fecham a formação',
  })
  replace(
    @ClubIdParam() id: number,
    @Body() body: SetLineupDto,
  ): Promise<LineupResponseDto> {
    return this.lineups.replace(id, body);
  }

  @Get(':id/lineup')
  @ApiOkResponse({
    type: LineupResponseDto,
    description:
      'Sem escalação: formation null, complete false e players vazio; incompleta: a formação salva e os titulares que sobraram',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Clube inexistente',
  })
  find(@ClubIdParam() id: number): Promise<LineupResponseDto> {
    return this.lineups.find(id);
  }
}
