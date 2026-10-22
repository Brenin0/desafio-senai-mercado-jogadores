import { Type } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Clock } from '../src/common/clock/clock';

export interface TestAppOptions {
  /** Controllers só de teste, além dos da aplicação. */
  controllers?: Type[];
  /** Relógio fixo: o "agora" do servidor em todas as operações. */
  now?: Date;
}

export async function createTestApp({
  controllers = [],
  now,
}: TestAppOptions = {}): Promise<NestExpressApplication> {
  const builder = Test.createTestingModule({
    imports: [AppModule],
    controllers,
  });
  if (now) {
    builder.overrideProvider(Clock).useValue({ now: () => new Date(now) });
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false,
  });
  configureApp(app);
  await app.init();
  return app;
}
