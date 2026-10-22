import { Injectable } from '@nestjs/common';
import { Player } from '../domain/player';
import { PrismaService } from '../prisma/prisma.service';
import { PLAYER_COLUMNS, toPlayer } from './player-row';

export type NewPlayer = Omit<Player, 'id'>;

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
}
