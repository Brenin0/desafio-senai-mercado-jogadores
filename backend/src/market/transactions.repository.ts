import { Injectable } from '@nestjs/common';
import { Transaction, TransactionType } from '../domain/transaction';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseClient } from '../prisma/transaction-runner';
import { TRANSACTION_COLUMNS, toTransaction } from './transaction-row';

export type NewTransaction = Omit<Transaction, 'id'>;

/** Filtros do histórico (RN17); ausente, não filtra. */
export interface TransactionFilters {
  types?: TransactionType[];
  playerId?: number;
}

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** RN12: o clube já vendeu este jogador alguma vez? */
  async hasSale(
    clubId: number,
    playerId: number,
    db: DatabaseClient,
  ): Promise<boolean> {
    const sales = await db.transaction.count({
      where: { clubId, playerId, type: 'VENDA' },
    });
    return sales > 0;
  }

  /**
   * RN17: transações do clube, da mais recente para a mais antiga (empate de data e hora pelo id
   * decrescente), filtradas pelos tipos e pelo jogador, quando informados.
   */
  async findByClub(
    clubId: number,
    filters: TransactionFilters,
  ): Promise<Transaction[]> {
    const rows = await this.prisma.transaction.findMany({
      where: {
        clubId,
        type: filters.types && { in: filters.types },
        playerId: filters.playerId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: TRANSACTION_COLUMNS,
    });
    return rows.map(toTransaction);
  }

  async create(
    transaction: NewTransaction,
    db: DatabaseClient,
  ): Promise<Transaction> {
    const row = await db.transaction.create({
      data: transaction,
      select: TRANSACTION_COLUMNS,
    });
    return toTransaction(row);
  }
}
