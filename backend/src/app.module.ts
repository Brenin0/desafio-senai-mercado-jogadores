import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClubsModule } from './clubs/clubs.module';
import { ClockModule } from './common/clock/clock.module';
import { validateEnvironment } from './config/environment';
import { MarketModule } from './market/market.module';
import { PlayersModule } from './players/players.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    ClockModule,
    PrismaModule,
    PlayersModule,
    ClubsModule,
    MarketModule,
  ],
})
export class AppModule {}
