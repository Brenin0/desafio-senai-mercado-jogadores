import { Module } from '@nestjs/common';
import { LineupRepository } from './lineup.repository';

@Module({
  providers: [LineupRepository],
  exports: [LineupRepository],
})
export class LeagueModule {}
