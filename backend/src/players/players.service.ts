import { Injectable, NotFoundException } from '@nestjs/common';
import { calculateBaseValue } from '../domain/base-value';
import { calculateOverall } from '../domain/overall';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerResponseDto } from './dto/player-response.dto';
import { PLAYER_NOT_FOUND } from './player.errors';
import { toPlayerResponse } from './player.presenter';
import { PlayersRepository } from './players.repository';

@Injectable()
export class PlayersService {
  constructor(private readonly players: PlayersRepository) {}

  /**
   * O jogador nasce livre e APTO (Cadastro de Jogadores). O valor base é calculado uma única vez,
   * aqui, com o overall e a idade do cadastro (RN06).
   */
  async create(dto: CreatePlayerDto): Promise<PlayerResponseDto> {
    const overall = calculateOverall(dto.position, dto);
    const player = await this.players.create({
      name: dto.name,
      position: dto.position,
      agility: dto.agility,
      age: dto.age,
      pace: dto.pace,
      shooting: dto.shooting,
      passing: dto.passing,
      dribbling: dto.dribbling,
      defending: dto.defending,
      physical: dto.physical,
      potential: dto.potential,
      baseValue: calculateBaseValue({
        overall,
        potential: dto.potential,
        age: dto.age,
      }),
      condition: 'APTO',
      clubId: null,
    });
    return toPlayerResponse(player);
  }

  async findById(id: number): Promise<PlayerResponseDto> {
    const player = await this.players.findActiveById(id);
    if (!player) {
      throw new NotFoundException(PLAYER_NOT_FOUND);
    }
    return toPlayerResponse(player);
  }
}
