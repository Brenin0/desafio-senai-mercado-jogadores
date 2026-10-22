import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
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
import { ClubIdParam } from './club-id.param';
import { ClubsService } from './clubs.service';
import { ClubDetailResponseDto } from './dto/club-detail-response.dto';
import { ClubResponseDto } from './dto/club-response.dto';
import { CreateClubDto } from './dto/create-club.dto';
import { ListClubsQueryDto } from './dto/list-clubs-query.dto';

@ApiTags('Clubes')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Get()
  @ApiOkResponse({ type: [ClubResponseDto] })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'sort fora da lista',
  })
  list(@Query() query: ListClubsQueryDto): Promise<ClubResponseDto[]> {
    return this.clubs.list(query);
  }

  @Post()
  @ApiCreatedResponse({
    type: ClubResponseDto,
    description:
      'Clube criado com 300,00 em caixa; Location traz o caminho dele',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'Nome ou sigla fora do formato; sigla que não corresponde ao nome',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Nome ou sigla já cadastrados; limite de 20 clubes atingido',
  })
  async create(
    @Body() body: CreateClubDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ClubResponseDto> {
    const club = await this.clubs.create(body);
    response.location(resourcePath('clubs', club.id));
    return club;
  }

  @Get(':id')
  @ApiOkResponse({ type: ClubDetailResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Clube inexistente',
  })
  findById(@ClubIdParam() id: number): Promise<ClubDetailResponseDto> {
    return this.clubs.findById(id);
  }
}
