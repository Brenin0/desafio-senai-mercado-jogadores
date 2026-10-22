import { ConflictException, Injectable } from '@nestjs/common';
import { INITIAL_CLUB_CASH, MAX_CLUBS } from '../domain/club';
import { normalizeClubName } from '../domain/text';
import {
  acronymTakenMessage,
  clubNameTakenMessage,
  LEAGUE_FULL,
} from './club.errors';
import { toClubResponse } from './club.presenter';
import { ClubsRepository } from './clubs.repository';
import { ClubResponseDto } from './dto/club-response.dto';
import { CreateClubDto } from './dto/create-club.dto';

@Injectable()
export class ClubsService {
  constructor(private readonly clubs: ClubsRepository) {}

  /**
   * RN10: no máximo 20 clubes; nome único depois da V4, sem diferenciar maiúsculas e minúsculas,
   * mas considerando acentos; sigla única. O clube nasce com 300,00 em caixa e sem jogadores.
   */
  async create(dto: CreateClubDto): Promise<ClubResponseDto> {
    if ((await this.clubs.count()) >= MAX_CLUBS) {
      throw new ConflictException(LEAGUE_FULL);
    }
    const normalizedName = normalizeClubName(dto.name);
    if (await this.clubs.existsWithNormalizedName(normalizedName)) {
      throw new ConflictException(clubNameTakenMessage(dto.name));
    }
    if (await this.clubs.existsWithAcronym(dto.acronym)) {
      throw new ConflictException(acronymTakenMessage(dto.acronym));
    }
    const club = await this.clubs.create({
      name: dto.name,
      normalizedName,
      acronym: dto.acronym,
      cash: INITIAL_CLUB_CASH,
    });
    return toClubResponse(club, []);
  }
}
