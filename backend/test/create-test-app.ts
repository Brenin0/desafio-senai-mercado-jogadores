import { Type } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Clock } from '../src/common/clock/clock';
import { TestClock } from './test-clock';

export interface TestAppOptions {
  /** Controllers só de teste, além dos da aplicação. */
  controllers?: Type[];
  /** Relógio controlado pelo teste: o "agora" do servidor em todas as operações. */
  clock?: TestClock;
}

export async function createTestApp({
  controllers = [],
  clock,
}: TestAppOptions = {}): Promise<NestExpressApplication> {
  const builder = Test.createTestingModule({
    imports: [AppModule],
    controllers,
  });
  if (clock) {
    builder.overrideProvider(Clock).useValue(clock);
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false,
  });
  configureApp(app);
  await app.init();
  return app;
}
