import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module';
import { PlayersModule } from '../players/players.module';
import { LineupController } from './lineup.controller';
import { LineupDataModule } from './lineup-data.module';
import { LineupService } from './lineup.service';
import { MatchesController } from './matches.controller';
import { MatchesRepository } from './matches.repository';
import { MatchesService } from './matches.service';
import { StandingsController } from './standings.controller';
import { StandingsService } from './standings.service';

@Module({
  imports: [PlayersModule, ClubsModule, LineupDataModule],
  controllers: [LineupController, MatchesController, StandingsController],
  providers: [
    LineupService,
    MatchesService,
    StandingsService,
    MatchesRepository,
  ],
})
export class LeagueModule {}
