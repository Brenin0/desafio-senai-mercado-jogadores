import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CLUB_NOT_FOUND } from '../clubs/club.errors';
import { ClubsRepository } from '../clubs/clubs.repository';
import { Clock } from '../common/clock/clock';
import { canPlay, fitsFormation, Formation } from '../domain/lineup';
import { Player } from '../domain/player';
import { PLAYER_NOT_FOUND } from '../players/player.errors';
import { PlayersRepository } from '../players/players.repository';
import { TransactionRunner } from '../prisma/transaction-runner';
import { LineupResponseDto } from './dto/lineup-response.dto';
import { SetLineupDto } from './dto/set-lineup.dto';
import {
  formationMismatchMessage,
  playerOutsideSquadMessage,
  sickStarterMessage,
} from './lineup.errors';
import { toLineupResponse } from './lineup.presenter';
import { LineupRepository } from './lineup.repository';

@Injectable()
export class LineupService {
  constructor(
    private readonly lineups: LineupRepository,
    private readonly clubs: ClubsRepository,
    private readonly players: PlayersRepository,
    private readonly transaction: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  /** RN19: a escalação atual; sem escalação, formação nula e nenhum titular. */
  async find(clubId: number): Promise<LineupResponseDto> {
    const lineup = await this.lineups.findByClub(clubId);
    if (!lineup) {
      throw new NotFoundException(CLUB_NOT_FOUND);
    }
    return toLineupResponse(clubId, lineup);
  }

  /**
   * RN19: substitui a escalação inteira numa única operação, a formação e os 5 titulares. Clube ou
   * jogador inexistente (inclusive excluído) → 404. Escalar não muda o caixa.
   */
  async replace(
    clubId: number,
    { formation, player_ids }: SetLineupDto,
  ): Promise<LineupResponseDto> {
    const now = this.clock.now();
    return this.transaction.run(async (db) => {
      if (!(await this.clubs.exists(clubId, db))) {
        throw new NotFoundException(CLUB_NOT_FOUND);
      }
      const players = await this.players.findActiveByIds(player_ids, db);
      if (players.length !== player_ids.length) {
        throw new NotFoundException(PLAYER_NOT_FOUND);
      }
      this.assertCanStart(clubId, formation, players);
      await this.lineups.replace(
        { clubId, formation, playerIds: player_ids, createdAt: now },
        db,
      );
      return toLineupResponse(clubId, { formation, players });
    });
  }

  /**
   * RN19, nesta ordem (D01): todos do elenco do clube, nenhum DOENTE e as posições fechando a
   * formação (1 GOL e os jogadores de linha de cada setor).
   */
  private assertCanStart(
    clubId: number,
    formation: Formation,
    players: Player[],
  ): void {
    const outsider = players.find((player) => player.clubId !== clubId);
    if (outsider) {
      throw new ConflictException(playerOutsideSquadMessage(outsider.name));
    }
    const sick = players.find((player) => !canPlay(player));
    if (sick) {
      throw new ConflictException(sickStarterMessage(sick.name));
    }
    const positions = players.map((player) => player.position);
    if (!fitsFormation(formation, positions)) {
      throw new ConflictException(formationMismatchMessage(formation));
    }
  }
}
