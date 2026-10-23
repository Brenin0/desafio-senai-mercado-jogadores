import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module';
import { PlayersModule } from '../players/players.module';
import { LineupController } from './lineup.controller';
import { LineupDataModule } from './lineup-data.module';
import { LineupService } from './lineup.service';
import { MatchesController } from './matches.controller';
import { MatchesRepository } from './matches.repository';
import { MatchesService } from './matches.service';

@Module({
  imports: [PlayersModule, ClubsModule, LineupDataModule],
  controllers: [LineupController, MatchesController],
  providers: [LineupService, MatchesService, MatchesRepository],
})
export class LeagueModule {}
