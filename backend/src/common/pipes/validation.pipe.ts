import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: (errors) =>
      new BadRequestException(formatValidationErrors(errors)),
  });
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return collectMessages(errors).join('; ');
}

function collectMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collectMessages(error.children ?? []),
  ]);
}
