import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Condition, Player, Position } from '../domain/player';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseClient } from '../prisma/transaction-runner';
import { PLAYER_COLUMNS, toPlayer } from './player-row';

export type NewPlayer = Omit<Player, 'id'>;

/** RN08: os únicos campos que mudam depois do cadastro. */
export type PlayerChanges = Pick<
  Player,
  'name' | 'position' | 'agility' | 'age'
>;

/** Filtros de GET /players que são colunas de `jogadores`, aplicados no banco (RN07). */
export interface PlayerColumnFilters {
  position?: Position;
  condition?: Condition;
  free?: boolean;
  clubId?: number;
  minAge?: number;
  maxAge?: number;
}

/** `club_id` filtra o elenco; sem ele, `free=true` pede só os livres e `free=false`, só os com clube. */
function clubFilter({
  clubId,
  free,
}: PlayerColumnFilters): Prisma.PlayerWhereInput['clubId'] {
  if (clubId !== undefined) {
    return clubId;
  }
  if (free === undefined) {
    return undefined;
  }
  return free ? null : { not: null };
}

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

  /** Jogadores não excluídos que atendem aos filtros de coluna, sem ordem (RN07 e RN09). */
  async findActive(filters: PlayerColumnFilters): Promise<Player[]> {
    const rows = await this.prisma.player.findMany({
      where: {
        deletedAt: null,
        position: filters.position,
        condition: filters.condition,
        clubId: clubFilter(filters),
        age: { gte: filters.minAge, lte: filters.maxAge },
      },
      select: PLAYER_COLUMNS,
    });
    return rows.map(toPlayer);
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
