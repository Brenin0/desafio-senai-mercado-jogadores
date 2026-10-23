import { Injectable, NotFoundException } from '@nestjs/common';
import { CLUB_NOT_FOUND } from '../clubs/club.errors';
import { ClubsRepository } from '../clubs/clubs.repository';
import { Transaction, TransactionType } from '../domain/transaction';
import { PLAYER_NOT_FOUND } from '../players/player.errors';
import { PlayersRepository } from '../players/players.repository';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { TransactionHistoryResponseDto } from './dto/transaction-history-response.dto';
import { toTransactionHistoryResponse } from './transaction.presenter';
import { toTransactionsCsv } from './transactions-csv';
import { TransactionsRepository } from './transactions.repository';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly clubs: ClubsRepository,
    private readonly players: PlayersRepository,
    private readonly transactions: TransactionsRepository,
  ) {}

  /** RN17: histórico do clube, com o `summary` das transações filtradas. */
  async history(
    clubId: number,
    query: ListTransactionsQueryDto,
  ): Promise<TransactionHistoryResponseDto> {
    return toTransactionHistoryResponse(await this.findFiltered(clubId, query));
  }

  /** RN18: o mesmo histórico, com os mesmos filtros e validações, em CSV. */
  async exportCsv(
    clubId: number,
    query: ListTransactionsQueryDto,
  ): Promise<string> {
    return toTransactionsCsv(await this.findFiltered(clubId, query));
  }

  /**
   * RN17 e RN18: clube inexistente → 404; jogador do filtro inexistente ou excluído → 404 (RN09).
   * Jogador sem transações no clube não é erro: o histórico vem vazio.
   */
  private async findFiltered(
    clubId: number,
    { type, player_id }: ListTransactionsQueryDto,
  ): Promise<Transaction[]> {
    if (!(await this.clubs.exists(clubId))) {
      throw new NotFoundException(CLUB_NOT_FOUND);
    }
    if (
      player_id !== undefined &&
      !(await this.players.findActiveById(player_id))
    ) {
      throw new NotFoundException(PLAYER_NOT_FOUND);
    }
    return this.transactions.findByClub(clubId, {
      // O formato do type já foi validado no DTO (IsQueryList).
      types: type?.split(',') as TransactionType[] | undefined,
      playerId: player_id,
    });
  }
}
