import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

/**
 * ValidationPipe sem conversão implícita (V2). O padrão do Nest converte parâmetros da URL e da query
 * declarados como número com `+valor` (`"01"` viraria 1) antes dos pipes da rota; aqui eles chegam
 * como texto, e quem converte é o pipe de cada parâmetro, com as regras dele.
 */
class StrictValidationPipe extends ValidationPipe {
  protected transformPrimitive(value: unknown): unknown {
    return value;
  }
}

export function createValidationPipe(): ValidationPipe {
  return new StrictValidationPipe({
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
