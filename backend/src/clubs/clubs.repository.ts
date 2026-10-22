import { Injectable } from '@nestjs/common';
import { Club } from '../domain/club';
import { PrismaService } from '../prisma/prisma.service';
import { CLUB_COLUMNS, toClub } from './club-row';

/** Clube a gravar, com o nome normalizado da RN10, que tem índice único no banco. */
export type NewClub = Omit<Club, 'id'> & { normalizedName: string };

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
}
