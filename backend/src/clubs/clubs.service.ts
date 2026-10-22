import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Clock } from '../common/clock/clock';
import { INITIAL_CLUB_CASH, MAX_CLUBS } from '../domain/club';
import { sortClubs } from '../domain/club-listing';
import { calculateClubWorth } from '../domain/club-worth';
import { compareRosterOrder } from '../domain/roster';
import { normalizeClubName } from '../domain/text';
import {
  acronymTakenMessage,
  CLUB_NOT_FOUND,
  clubNameTakenMessage,
  LEAGUE_FULL,
} from './club.errors';
import { toClubDetailResponse, toClubResponse } from './club.presenter';
import { ClubsRepository } from './clubs.repository';
import { ClubDetailResponseDto } from './dto/club-detail-response.dto';
import { ClubResponseDto } from './dto/club-response.dto';
import { CreateClubDto } from './dto/create-club.dto';
import { ListClubsQueryDto } from './dto/list-clubs-query.dto';

@Injectable()
export class ClubsService {
  constructor(
    private readonly clubs: ClubsRepository,
    private readonly clock: Clock,
  ) {}

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
    return toClubResponse({ club, worth: calculateClubWorth(club.cash, []) });
  }

  /** RN11: clubes com o patrimônio do momento, pelo nome ou pelo patrimônio. */
  async list({ sort }: ListClubsQueryDto): Promise<ClubResponseDto[]> {
    const clubs = await this.clubs.findAllWithPlayers();
    const valued = clubs.map(({ club, players }) => ({
      club,
      worth: calculateClubWorth(club.cash, players),
    }));
    return sortClubs(valued, sort).map(toClubResponse);
  }

  /** RN11: o clube com o elenco por posição, nome e id, e o contrato de cada jogador. */
  async findById(id: number): Promise<ClubDetailResponseDto> {
    const club = await this.clubs.findById(id);
    if (!club) {
      throw new NotFoundException(CLUB_NOT_FOUND);
    }
    const squad = await this.clubs.findSquad(id);
    const worth = calculateClubWorth(
      club.cash,
      squad.map(({ player }) => player),
    );
    const orderedSquad = [...squad].sort((a, b) =>
      compareRosterOrder(a.player, b.player),
    );
    return toClubDetailResponse(
      { club, worth },
      orderedSquad,
      this.clock.now(),
    );
  }
}
