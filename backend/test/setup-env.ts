import { e2eDatabaseUrl } from './e2e-database-url';

process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.DATABASE_URL = e2eDatabaseUrl();
