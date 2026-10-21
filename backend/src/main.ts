import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { EnvironmentVariables } from './config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const port = app
    .get<ConfigService<EnvironmentVariables, true>>(ConfigService)
    .get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API em http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
