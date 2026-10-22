import { Injectable } from '@nestjs/common';
import { Condition, Player } from '../domain/player';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseClient } from '../prisma/transaction-runner';
import { PLAYER_COLUMNS, toPlayer } from './player-row';

export type NewPlayer = Omit<Player, 'id'>;

/** RN08: os únicos campos que mudam depois do cadastro. */
export type PlayerChanges = Pick<
  Player,
  'name' | 'position' | 'agility' | 'age'
>;

@Injectable()
export class PlayersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(player: NewPlayer): Promise<Player> {
    const row = await this.prisma.player.create({
      data: player,
      select: PLAYER_COLUMNS,
    });
    return toPlayer(row);
  }

  /** RN09: jogador excluído conta como inexistente. */
  async findActiveById(id: number): Promise<Player | null> {
    const row = await this.prisma.player.findFirst({
      where: { id, deletedAt: null },
      select: PLAYER_COLUMNS,
    });
    return row && toPlayer(row);
  }

  async update(id: number, changes: PlayerChanges): Promise<Player> {
    const row = await this.prisma.player.update({
      where: { id },
      data: changes,
      select: PLAYER_COLUMNS,
    });
    return toPlayer(row);
  }

  async updateCondition(
    id: number,
    condition: Condition,
    db: DatabaseClient,
  ): Promise<Player> {
    const row = await db.player.update({
      where: { id },
      data: { condition },
      select: PLAYER_COLUMNS,
    });
    return toPlayer(row);
  }

  /** RN09: exclusão lógica; nada é apagado do banco. */
  async markDeleted(id: number, deletedAt: Date): Promise<void> {
    await this.prisma.player.update({ where: { id }, data: { deletedAt } });
  }
}
