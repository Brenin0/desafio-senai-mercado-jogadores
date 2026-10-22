import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ENV_FILE = join(__dirname, '..', '.env');
const E2E_DATABASE_SUFFIX = '_e2e';

/**
 * Banco dos testes e2e: o mesmo servidor da DATABASE_URL (variável ou `.env`), num banco separado
 * com o sufixo `_e2e`, para os testes nunca apagarem os dados do banco da aplicação.
 */
export function e2eDatabaseUrl(): string {
  if (process.env.DATABASE_URL === undefined && existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
  }
  if (process.env.DATABASE_URL === undefined) {
    throw new Error(
      'Defina DATABASE_URL (no .env da pasta backend) para rodar os testes e2e.',
    );
  }
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `${url.pathname}${E2E_DATABASE_SUFFIX}`;
  return url.toString();
}

export function isE2eDatabase(name: string): boolean {
  return name.endsWith(E2E_DATABASE_SUFFIX);
}
