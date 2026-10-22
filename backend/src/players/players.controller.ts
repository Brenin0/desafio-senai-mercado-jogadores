import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ErrorResponseDto } from '../common/http/error-response.dto';
import { resourcePath } from '../common/http/resource-path';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerResponseDto } from './dto/player-response.dto';
import { PlayerIdParam } from './player-id.param';
import { PlayersService } from './players.service';

@ApiTags('Jogadores')
@Controller('players')
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Post()
  @ApiCreatedResponse({
    type: PlayerResponseDto,
    description:
      'Jogador cadastrado, livre e APTO; Location traz o caminho dele',
  })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  async create(
    @Body() body: CreatePlayerDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PlayerResponseDto> {
    const player = await this.players.create(body);
    response.location(resourcePath('players', player.id));
    return player;
  }

  @Get(':id')
  @ApiOkResponse({ type: PlayerResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Jogador inexistente ou excluído',
  })
  findById(@PlayerIdParam() id: number): Promise<PlayerResponseDto> {
    return this.players.findById(id);
  }
}
