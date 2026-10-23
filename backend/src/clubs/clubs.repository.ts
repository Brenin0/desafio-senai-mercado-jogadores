import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { Club } from '../domain/club';
import { ACTIVE_CONTRACT_STATUS, SquadMember } from '../domain/contract';
import { Player } from '../domain/player';
import { PLAYER_COLUMNS, toPlayer } from '../players/player-row';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseClient } from '../prisma/transaction-runner';
import { CLUB_COLUMNS, toClub } from './club-row';

/** Clube a gravar, com o nome normalizado da RN10, que tem índice único no banco. */
export type NewClub = Omit<Club, 'id'> & { normalizedName: string };

export interface ClubWithPlayers {
  club: Club;
  players: Player[];
}

@Injectable()
export class ClubsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async exists(id: number): Promise<boolean> {
    return (await this.prisma.club.count({ where: { id } })) > 0;
  }

  count(): Promise<number> {
    return this.prisma.club.count();
  }

  async existsWithNormalizedName(normalizedName: string): Promise<boolean> {
    return (await this.prisma.club.count({ where: { normalizedName } })) > 0;
  }

  async existsWithAcronym(acronym: string): Promise<boolean> {
    return (await this.prisma.club.count({ where: { acronym } })) > 0;
  }

  async create(club: NewClub): Promise<Club> {
    const row = await this.prisma.club.create({
      data: club,
      select: CLUB_COLUMNS,
    });
    return toClub(row);
  }

  async findById(
    id: number,
    db: DatabaseClient = this.prisma,
  ): Promise<Club | null> {
    const row = await db.club.findUnique({
      where: { id },
      select: CLUB_COLUMNS,
    });
    return row && toClub(row);
  }

  /** RN14: quantidade de jogadores no elenco. */
  countSquad(clubId: number, db: DatabaseClient): Promise<number> {
    return db.player.count({ where: { clubId, deletedAt: null } });
  }

  /** RN12: desconta o custo da compra do caixa e devolve o caixa novo. */
  async debitCash(
    id: number,
    amount: Decimal,
    db: DatabaseClient,
  ): Promise<Decimal> {
    const { cash } = await db.club.update({
      where: { id },
      data: { cash: { decrement: amount } },
      select: { cash: true },
    });
    return new Decimal(cash.toString());
  }

  /** Todos os clubes, cada um com os jogadores do elenco, sem ordem (RN11). */
  async findAllWithPlayers(): Promise<ClubWithPlayers[]> {
    const rows = await this.prisma.club.findMany({
      select: {
        ...CLUB_COLUMNS,
        players: { where: { deletedAt: null }, select: PLAYER_COLUMNS },
      },
    });
    return rows.map(({ players, ...club }) => ({
      club: toClub(club),
      players: players.map(toPlayer),
    }));
  }

  /** Elenco do clube: os jogadores com contrato ATIVO com ele, sem ordem (RN11). */
  async findSquad(clubId: number): Promise<SquadMember[]> {
    const rows = await this.prisma.contract.findMany({
      where: {
        clubId,
        status: ACTIVE_CONTRACT_STATUS,
        player: { deletedAt: null },
      },
      select: {
        purchaseValue: true,
        loyaltyUntil: true,
        player: { select: PLAYER_COLUMNS },
      },
    });
    return rows.map(({ player, purchaseValue, loyaltyUntil }) => ({
      player: toPlayer(player),
      contract: {
        purchaseValue: new Decimal(purchaseValue.toString()),
        loyaltyUntil,
      },
    }));
  }
}
