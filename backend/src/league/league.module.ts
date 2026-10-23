import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module';
import { PlayersModule } from '../players/players.module';
import { LineupController } from './lineup.controller';
import { LineupDataModule } from './lineup-data.module';
import { LineupService } from './lineup.service';

@Module({
  imports: [PlayersModule, ClubsModule, LineupDataModule],
  controllers: [LineupController],
  providers: [LineupService],
})
export class LeagueModule {}
