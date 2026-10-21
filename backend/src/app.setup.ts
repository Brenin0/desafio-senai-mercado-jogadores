import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { rejectInvalidJson } from './common/middlewares/reject-invalid-json.middleware';
import { createRequestLogger } from './common/middlewares/request-logger.middleware';
import { BodyMustBeObjectPipe } from './common/pipes/body-must-be-object.pipe';
import { createValidationPipe } from './common/pipes/validation.pipe';
import { EnvironmentVariables } from './config/environment';
import { setupSwagger } from './config/swagger';

const API_PREFIX = 'api/v1';

export function configureApp(app: NestExpressApplication): void {
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.use(createRequestLogger(new Logger('HTTP')));
  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({ origin: config.get('FRONTEND_ORIGIN', { infer: true }) });
  app.useBodyParser('json', { strict: false });
  app.use(rejectInvalidJson);
  app.useGlobalPipes(new BodyMustBeObjectPipe(), createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app);
}
