import { plainToInstance } from 'class-transformer';
import { IsInt, Matches, Max, Min, validateSync } from 'class-validator';

const ORIGIN_PATTERN = /^https?:\/\/[^/\s]+$/;
const POSTGRES_URL_PATTERN = /^postgres(ql)?:\/\/\S+$/;

export class EnvironmentVariables {
  @IsInt({ message: 'PORT deve ser um número inteiro' })
  @Min(1, { message: 'PORT deve estar entre 1 e 65535' })
  @Max(65535, { message: 'PORT deve estar entre 1 e 65535' })
  PORT: number = 3000;

  @Matches(ORIGIN_PATTERN, {
    message:
      'FRONTEND_ORIGIN deve ser uma origem como http://localhost:5173, sem caminho e sem barra no final',
  })
  FRONTEND_ORIGIN!: string;

  @Matches(POSTGRES_URL_PATTERN, {
    message:
      'DATABASE_URL deve ser uma URL de conexão do PostgreSQL, como postgresql://usuario:senha@localhost:5433/banco',
  })
  DATABASE_URL!: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const environment = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(environment);
  if (errors.length > 0) {
    const problems = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    throw new Error(`Variáveis de ambiente inválidas: ${problems.join('; ')}`);
  }
  return environment;
}
