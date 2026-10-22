import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module';
import { LeagueModule } from '../league/league.module';
import { PlayersController } from './players.controller';
import { PlayersRepository } from './players.repository';
import { PlayersService } from './players.service';

@Module({
  imports: [ClubsModule, LeagueModule],
  controllers: [PlayersController],
  providers: [PlayersService, PlayersRepository],
})
export class PlayersModule {}
