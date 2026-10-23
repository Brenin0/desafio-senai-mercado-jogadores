import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ErrorResponseDto } from '../common/http/error-response.dto';
import { resourcePath } from '../common/http/resource-path';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { MatchIdParam } from './match-id.param';
import { MatchesService } from './matches.service';

@ApiTags('Liga')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Post()
  @ApiCreatedResponse({
    type: MatchResponseDto,
    description:
      'Partida jogada e gravada com os 6 duelos; Location traz o caminho dela',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'home_club_id ou away_club_id ausentes ou inválidos; mandante igual ao visitante',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Clube inexistente',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Escalação incompleta no mandante ou no visitante',
  })
  async play(
    @Body() body: CreateMatchDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MatchResponseDto> {
    const match = await this.matches.play(body);
    response.location(resourcePath('matches', match.id));
    return match;
  }

  @Get(':id')
  @ApiOkResponse({ type: MatchResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Partida inexistente',
  })
  findById(@MatchIdParam() id: number): Promise<MatchResponseDto> {
    return this.matches.findById(id);
  }
}
