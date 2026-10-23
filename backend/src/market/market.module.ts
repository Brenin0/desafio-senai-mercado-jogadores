import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module';
import { LeagueModule } from '../league/league.module';
import { PlayersModule } from '../players/players.module';
import { ContractsRepository } from './contracts.repository';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { TransactionsRepository } from './transactions.repository';

@Module({
  imports: [PlayersModule, ClubsModule, LeagueModule],
  controllers: [MarketController],
  providers: [MarketService, ContractsRepository, TransactionsRepository],
})
export class MarketModule {}
