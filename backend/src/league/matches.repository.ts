import { Injectable } from '@nestjs/common';
import { Formation } from '../domain/lineup';
import { Match, MatchWithDuels } from '../domain/match';
import { Duel } from '../domain/match-engine';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseClient } from '../prisma/transaction-runner';
import {
  MATCH_COLUMNS,
  MATCH_WITH_DUELS_COLUMNS,
  toDuelData,
  toMatch,
  toMatchWithDuels,
} from './match-row';

/** Partida a gravar: os clubes, as formações e o placar do momento, e os 6 duelos (RN20). */
export interface NewMatch {
  homeClubId: number;
  awayClubId: number;
  homeFormation: Formation;
  awayFormation: Formation;
  homeGoals: number;
  awayGoals: number;
  playedAt: Date;
  duels: Duel[];
}

@Injectable()
export class MatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** RN20: grava a partida e os 6 duelos juntos. */
  async create(
    { duels, ...match }: NewMatch,
    db: DatabaseClient,
  ): Promise<MatchWithDuels> {
    const row = await db.match.create({
      data: { ...match, duels: { create: duels.map(toDuelData) } },
      select: MATCH_WITH_DUELS_COLUMNS,
    });
    return toMatchWithDuels(row);
  }

  /**
   * RN21: partidas da mais recente para a mais antiga (no mesmo instante, maior id primeiro), sem
   * os duelos; com o clube, só as em que ele foi mandante ou visitante.
   */
  async findAll(clubId?: number): Promise<Match[]> {
    const rows = await this.prisma.match.findMany({
      where:
        clubId === undefined
          ? {}
          : { OR: [{ homeClubId: clubId }, { awayClubId: clubId }] },
      orderBy: [{ playedAt: 'desc' }, { id: 'desc' }],
      select: MATCH_COLUMNS,
    });
    return rows.map(toMatch);
  }

  /** RN21: a partida com os 6 duelos, na ordem; null se não existe. */
  async findById(id: number): Promise<MatchWithDuels | null> {
    const row = await this.prisma.match.findUnique({
      where: { id },
      select: MATCH_WITH_DUELS_COLUMNS,
    });
    return row && toMatchWithDuels(row);
  }
}
