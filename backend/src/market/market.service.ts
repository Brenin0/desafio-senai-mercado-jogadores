import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import { CLUB_NOT_FOUND } from '../clubs/club.errors';
import { ClubsRepository } from '../clubs/clubs.repository';
import { Clock } from '../common/clock/clock';
import { Club, MAX_SQUAD_SIZE } from '../domain/club';
import { isLoyaltyUntilAllowed } from '../domain/contract';
import { calculateMarketValue } from '../domain/market-value';
import { Player } from '../domain/player';
import { evaluatePurchase } from '../domain/purchase-fee';
import { evaluateSale } from '../domain/sale';
import { LineupRepository } from '../league/lineup.repository';
import { PLAYER_NOT_FOUND } from '../players/player.errors';
import { PlayersRepository } from '../players/players.repository';
import {
  DatabaseClient,
  TransactionRunner,
} from '../prisma/transaction-runner';
import { ContractsRepository } from './contracts.repository';
import { BuyPlayerDto } from './dto/buy-player.dto';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import {
  costAboveLimitMessage,
  FREE_PLAYER_NOT_SELLABLE,
  LOYALTY_OUT_OF_RANGE,
  PLAYER_NOT_FREE,
  REBUY_FORBIDDEN,
  SQUAD_FULL,
} from './market.errors';
import { toPurchaseResponse, toSaleResponse } from './transaction.presenter';
import { TransactionsRepository } from './transactions.repository';

@Injectable()
export class MarketService {
  constructor(
    private readonly players: PlayersRepository,
    private readonly clubs: ClubsRepository,
    private readonly contracts: ContractsRepository,
    private readonly transactions: TransactionsRepository,
    private readonly lineups: LineupRepository,
    private readonly transaction: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  /**
   * RN12 a RN14: compra pelo valor de mercado do momento, mais a taxa, até 50% do caixa. Numa única
   * operação: desconta o caixa, põe o jogador no elenco, cria o contrato ATIVO e grava a COMPRA.
   */
  async buy(
    playerId: number,
    { club_id, loyalty_until }: BuyPlayerDto,
  ): Promise<PurchaseResponseDto> {
    const now = this.clock.now();
    if (!isLoyaltyUntilAllowed(loyalty_until, now)) {
      throw new BadRequestException(LOYALTY_OUT_OF_RANGE);
    }
    return this.transaction.run(async (db) => {
      const player = await this.players.findActiveById(playerId, db);
      if (!player) {
        throw new NotFoundException(PLAYER_NOT_FOUND);
      }
      const club = await this.clubs.findById(club_id, db);
      if (!club) {
        throw new NotFoundException(CLUB_NOT_FOUND);
      }
      await this.assertCanSign(player, club, db);
      const marketValue = calculateMarketValue(player);
      const purchase = evaluatePurchase({ cash: club.cash, marketValue });
      if (!purchase.allowed) {
        throw new ConflictException(
          costAboveLimitMessage(purchase.totalCost, purchase.cashLimit),
        );
      }
      if (!(await this.players.signForClub(player.id, club.id, db))) {
        throw new ConflictException(PLAYER_NOT_FREE);
      }
      const cashChange = purchase.totalCost.negated();
      const clubCash = await this.clubs.applyCashChange(
        club.id,
        cashChange,
        db,
      );
      const contract = await this.contracts.createActive(
        {
          playerId: player.id,
          clubId: club.id,
          purchaseValue: marketValue,
          loyaltyUntil: loyalty_until,
          startedAt: now,
        },
        db,
      );
      const transaction = await this.transactions.create(
        {
          clubId: club.id,
          playerId: player.id,
          playerName: player.name,
          type: 'COMPRA',
          value: marketValue,
          fee: purchase.fee,
          penalty: new Decimal(0),
          profit: null,
          cashChange,
          createdAt: now,
        },
        db,
      );
      return toPurchaseResponse(transaction, contract, clubCash);
    });
  }

  /**
   * RN15 e RN16: venda pelo clube atual, pelo valor de mercado do momento, com multa por fidelidade
   * e comissão sobre o lucro. Numa única operação: credita o caixa, deixa o jogador livre, fecha o
   * contrato, grava a VENDA e tira o jogador da escalação (RN19).
   */
  async sell(playerId: number): Promise<SaleResponseDto> {
    const now = this.clock.now();
    return this.transaction.run(async (db) => {
      const player = await this.players.findActiveById(playerId, db);
      if (!player) {
        throw new NotFoundException(PLAYER_NOT_FOUND);
      }
      const { clubId } = player;
      if (clubId === null) {
        throw new ConflictException(FREE_PLAYER_NOT_SELLABLE);
      }
      // Libera o jogador antes de ler o contrato: numa venda simultânea, só uma passa daqui.
      if (!(await this.players.releaseFromClub(player.id, clubId, db))) {
        throw new ConflictException(FREE_PLAYER_NOT_SELLABLE);
      }
      const contract = await this.contracts.findActive(player.id, clubId, db);
      const marketValue = calculateMarketValue(player);
      const sale = evaluateSale({
        purchaseValue: contract.purchaseValue,
        marketValue,
        loyaltyUntil: contract.loyaltyUntil,
        now,
      });
      await this.lineups.removePlayer(player.id, db);
      await this.contracts.close(contract.id, sale.contractStatus, now, db);
      const clubCash = await this.clubs.applyCashChange(
        clubId,
        sale.credit,
        db,
      );
      const transaction = await this.transactions.create(
        {
          clubId,
          playerId: player.id,
          playerName: player.name,
          type: 'VENDA',
          value: marketValue,
          fee: sale.commission,
          penalty: sale.penalty,
          profit: sale.profit,
          cashChange: sale.credit,
          createdAt: now,
        },
        db,
      );
      return toSaleResponse(
        transaction,
        sale,
        contract.purchaseValue,
        clubCash,
      );
    });
  }

  /** RN12 e RN14, nesta ordem: o jogador está livre, o clube não o vendeu antes e o elenco tem vaga. */
  private async assertCanSign(
    player: Player,
    club: Club,
    db: DatabaseClient,
  ): Promise<void> {
    if (player.clubId !== null) {
      throw new ConflictException(PLAYER_NOT_FREE);
    }
    if (await this.transactions.hasSale(club.id, player.id, db)) {
      throw new ConflictException(REBUY_FORBIDDEN);
    }
    if ((await this.clubs.countSquad(club.id, db)) >= MAX_SQUAD_SIZE) {
      throw new ConflictException(SQUAD_FULL);
    }
  }
}
