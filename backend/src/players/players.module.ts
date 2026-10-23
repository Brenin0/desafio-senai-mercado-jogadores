import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module';
import { LineupDataModule } from '../league/lineup-data.module';
import { PlayersController } from './players.controller';
import { PlayersRepository } from './players.repository';
import { PlayersService } from './players.service';

@Module({
  imports: [ClubsModule, LineupDataModule],
  controllers: [PlayersController],
  providers: [PlayersService, PlayersRepository],
  exports: [PlayersRepository],
})
export class PlayersModule {}
