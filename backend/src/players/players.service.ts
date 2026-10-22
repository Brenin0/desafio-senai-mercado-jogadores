import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Clock } from '../common/clock/clock';
import { calculateBaseValue } from '../domain/base-value';
import { calculateOverall } from '../domain/overall';
import { Player } from '../domain/player';
import { LineupRepository } from '../league/lineup.repository';
import { TransactionRunner } from '../prisma/transaction-runner';
import { ChangeConditionDto } from './dto/change-condition.dto';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerResponseDto } from './dto/player-response.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import {
  ageDecreaseMessage,
  PLAYER_IN_CLUB_NOT_DELETABLE,
  PLAYER_NOT_FOUND,
  POSITION_LOCKED_BY_CLUB,
  SICK_TO_FIT,
} from './player.errors';
import { toPlayerResponse } from './player.presenter';
import { PlayersRepository } from './players.repository';

@Injectable()
export class PlayersService {
  constructor(
    private readonly players: PlayersRepository,
    private readonly lineups: LineupRepository,
    private readonly transaction: TransactionRunner,
    private readonly clock: Clock,
  ) {}

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
    return toPlayerResponse(await this.findActive(id));
  }

  /**
   * RN08: muda só nome, posição, agilidade e idade. Jogador com clube não muda de posição, e a
   * idade não diminui. O valor base continua o do cadastro; o overall segue a posição nova.
   */
  async update(id: number, dto: UpdatePlayerDto): Promise<PlayerResponseDto> {
    const player = await this.findActive(id);
    if (player.clubId !== null && dto.position !== player.position) {
      throw new ConflictException(POSITION_LOCKED_BY_CLUB);
    }
    if (dto.age < player.age) {
      throw new ConflictException(ageDecreaseMessage(player.age));
    }
    const updated = await this.players.update(id, {
      name: dto.name,
      position: dto.position,
      agility: dto.agility,
      age: dto.age,
    });
    return toPlayerResponse(updated);
  }

  /**
   * Limites, `condition`: enviar a condição atual é aceito, sem mudança; de DOENTE não vai direto
   * para APTO. Quem passa a DOENTE sai da escalação na mesma operação (RN19).
   */
  async changeCondition(
    id: number,
    { condition }: ChangeConditionDto,
  ): Promise<PlayerResponseDto> {
    const player = await this.findActive(id);
    if (condition === player.condition) {
      return toPlayerResponse(player);
    }
    if (player.condition === 'DOENTE' && condition === 'APTO') {
      throw new ConflictException(SICK_TO_FIT);
    }
    const updated = await this.transaction.run(async (db) => {
      if (condition === 'DOENTE') {
        await this.lineups.removePlayer(id, db);
      }
      return this.players.updateCondition(id, condition, db);
    });
    return toPlayerResponse(updated);
  }

  /**
   * RN09: só jogador livre pode ser excluído. A exclusão é lógica: o jogador passa a contar como
   * inexistente, e as transações e partidas antigas continuam como foram gravadas.
   */
  async delete(id: number): Promise<void> {
    const player = await this.findActive(id);
    if (player.clubId !== null) {
      throw new ConflictException(PLAYER_IN_CLUB_NOT_DELETABLE);
    }
    await this.players.markDeleted(id, this.clock.now());
  }

  private async findActive(id: number): Promise<Player> {
    const player = await this.players.findActiveById(id);
    if (!player) {
      throw new NotFoundException(PLAYER_NOT_FOUND);
    }
    return player;
  }
}
