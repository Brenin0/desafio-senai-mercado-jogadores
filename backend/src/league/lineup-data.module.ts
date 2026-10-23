import { Module } from '@nestjs/common';
import { LineupRepository } from './lineup.repository';

/**
 * Só a camada de dados da escalação, usada também pela venda e pela alteração de condição, que tiram
 * o titular da escalação (RN19). Separada do LeagueModule, que depende do PlayersModule.
 */
@Module({
  providers: [LineupRepository],
  exports: [LineupRepository],
})
export class LineupDataModule {}
