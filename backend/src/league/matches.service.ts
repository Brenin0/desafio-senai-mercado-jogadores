import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CLUB_NOT_FOUND } from '../clubs/club.errors';
import { ClubsRepository } from '../clubs/clubs.repository';
import { Clock } from '../common/clock/clock';
import { Club } from '../domain/club';
import { canPlay, Formation, isLineupComplete } from '../domain/lineup';
import { MatchTeam, playMatch } from '../domain/match-engine';
import {
  DatabaseClient,
  TransactionRunner,
} from '../prisma/transaction-runner';
import { CreateMatchDto } from './dto/create-match.dto';
import { ListMatchesQueryDto } from './dto/list-matches-query.dto';
import {
  MatchResponseDto,
  MatchSummaryResponseDto,
} from './dto/match-response.dto';
import { LineupRepository } from './lineup.repository';
import { incompleteLineupMessage, MATCH_NOT_FOUND } from './match.errors';
import { toMatchResponse, toMatchSummaryResponse } from './match.presenter';
import { MatchesRepository } from './matches.repository';

/** Os titulares que entram na partida e a formação do momento. */
interface StartingTeam {
  formation: Formation;
  team: MatchTeam;
}

@Injectable()
export class MatchesService {
  constructor(
    private readonly matches: MatchesRepository,
    private readonly clubs: ClubsRepository,
    private readonly lineups: LineupRepository,
    private readonly transaction: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  /**
   * RN20: os dois clubes existem (404) e têm a escalação completa (409); os titulares do momento
   * disputam os 6 duelos, e a partida e os duelos são gravados numa única operação. A partida não
   * muda o caixa, a escalação nem os jogadores.
   */
  async play({
    home_club_id,
    away_club_id,
  }: CreateMatchDto): Promise<MatchResponseDto> {
    const now = this.clock.now();
    return this.transaction.run(async (db) => {
      const homeClub = await this.findClub(home_club_id, db);
      const awayClub = await this.findClub(away_club_id, db);
      const home = await this.startingTeam(homeClub, db);
      const away = await this.startingTeam(awayClub, db);
      const result = playMatch(home.team, away.team);
      const match = await this.matches.create(
        {
          homeClubId: homeClub.id,
          awayClubId: awayClub.id,
          homeFormation: home.formation,
          awayFormation: away.formation,
          homeGoals: result.homeGoals,
          awayGoals: result.awayGoals,
          playedAt: now,
          duels: result.duels,
        },
        db,
      );
      return toMatchResponse(match);
    });
  }

  /** RN21: histórico de partidas, sem os duelos; clube do filtro inexistente → 404. */
  async list({
    club_id,
  }: ListMatchesQueryDto): Promise<MatchSummaryResponseDto[]> {
    if (club_id !== undefined && !(await this.clubs.exists(club_id))) {
      throw new NotFoundException(CLUB_NOT_FOUND);
    }
    const matches = await this.matches.findAll(club_id);
    return matches.map(toMatchSummaryResponse);
  }

  /** RN21: a partida como foi gravada, com os 6 duelos. */
  async findById(id: number): Promise<MatchResponseDto> {
    const match = await this.matches.findById(id);
    if (!match) {
      throw new NotFoundException(MATCH_NOT_FOUND);
    }
    return toMatchResponse(match);
  }

  private async findClub(id: number, db: DatabaseClient): Promise<Club> {
    const club = await this.clubs.findById(id, db);
    if (!club) {
      throw new NotFoundException(CLUB_NOT_FOUND);
    }
    return club;
  }

  /**
   * RN19 e RN20: clube que nunca escalou, ou que perdeu um titular e não escalou de novo, não joga.
   * Os titulares entram com os dados do momento.
   */
  private async startingTeam(
    club: Club,
    db: DatabaseClient,
  ): Promise<StartingTeam> {
    const lineup = await this.lineups.findByClub(club.id, db);
    if (!lineup || !isLineupComplete(lineup)) {
      throw new ConflictException(incompleteLineupMessage(club.name));
    }
    return {
      formation: lineup.formation,
      team: { clubId: club.id, players: lineup.players.filter(canPlay) },
    };
  }
}
