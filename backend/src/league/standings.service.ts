import { Injectable } from '@nestjs/common';
import { ClubsRepository } from '../clubs/clubs.repository';
import { calculateStandings } from '../domain/standings';
import { StandingResponseDto } from './dto/standing-response.dto';
import { MatchesRepository } from './matches.repository';
import { toStandingResponse } from './standing.presenter';

@Injectable()
export class StandingsService {
  constructor(
    private readonly clubs: ClubsRepository,
    private readonly matches: MatchesRepository,
  ) {}

  /**
   * RN21: todos os clubes, inclusive os que ainda não jogaram, com a classificação calculada a cada
   * consulta a partir do placar das partidas gravadas.
   */
  async list(): Promise<StandingResponseDto[]> {
    const clubs = await this.clubs.findAll();
    const matches = await this.matches.findScores();
    return calculateStandings(clubs, matches).map(toStandingResponse);
  }
}
