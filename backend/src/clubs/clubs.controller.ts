import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ErrorResponseDto } from '../common/http/error-response.dto';
import { resourcePath } from '../common/http/resource-path';
import { ClubsService } from './clubs.service';
import { ClubResponseDto } from './dto/club-response.dto';
import { CreateClubDto } from './dto/create-club.dto';

@ApiTags('Clubes')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

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
}
