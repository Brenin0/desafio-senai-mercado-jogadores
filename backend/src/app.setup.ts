import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './config/environment';

const API_PREFIX = 'api/v1';

export function configureApp(app: INestApplication): void {
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({ origin: config.get('FRONTEND_ORIGIN', { infer: true }) });
}
