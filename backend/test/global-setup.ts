import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { e2eDatabaseUrl } from './e2e-database-url';

/** Cria o banco dos testes e2e, se ainda não existir, e aplica as migrations nele. */
export default function globalSetup(): void {
  execSync('npx prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: e2eDatabaseUrl() },
    stdio: 'pipe',
  });
}
