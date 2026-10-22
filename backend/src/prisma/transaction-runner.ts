import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

/** Cliente do banco recebido pelos repositories: o principal ou o de uma transação em andamento. */
export type DatabaseClient = Prisma.TransactionClient;

/** Executa as operações de vários repositories numa única transação: tudo é gravado ou nada é. */
@Injectable()
export class TransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(work: (transaction: DatabaseClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }
}
