import { Injectable } from '@nestjs/common';
import { Formation, Lineup } from '../domain/lineup';
import { PLAYER_COLUMNS, toPlayer } from '../players/player-row';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseClient } from '../prisma/transaction-runner';

/** Escalação a gravar: a formação e os 5 titulares, escalados no mesmo instante. */
export interface NewLineup {
  clubId: number;
  formation: Formation;
  playerIds: number[];
  createdAt: Date;
}

@Injectable()
export class LineupRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** RN19: a formação e os titulares do clube, sem ordem; null se o clube não existe. */
  async findByClub(
    clubId: number,
    db: DatabaseClient = this.prisma,
  ): Promise<Lineup | null> {
    const row = await db.club.findUnique({
      where: { id: clubId },
      select: {
        formation: true,
        lineupPlayers: { select: { player: { select: PLAYER_COLUMNS } } },
      },
    });
    return (
      row && {
        formation: row.formation as Formation | null,
        players: row.lineupPlayers.map(({ player }) => toPlayer(player)),
      }
    );
  }

  /** RN19: substitui a escalação inteira: a formação do clube e os titulares. */
  async replace(
    { clubId, formation, playerIds, createdAt }: NewLineup,
    db: DatabaseClient,
  ): Promise<void> {
    await db.club.update({ where: { id: clubId }, data: { formation } });
    await db.lineupPlayer.deleteMany({ where: { clubId } });
    await db.lineupPlayer.createMany({
      data: playerIds.map((playerId) => ({ clubId, playerId, createdAt })),
    });
  }

  /** RN19: o titular sai da escalação, que fica incompleta, com a mesma formação. */
  async removePlayer(playerId: number, db: DatabaseClient): Promise<void> {
    await db.lineupPlayer.deleteMany({ where: { playerId } });
  }
}
