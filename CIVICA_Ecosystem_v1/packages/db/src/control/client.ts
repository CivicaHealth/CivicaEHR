import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { loadEnvLocal } from '@civica/config';
import * as schema from './schema';
import { resolvePgSsl } from '../ssl';

loadEnvLocal(process.cwd());

const connectionString = process.env.DATABASE_URL_CONTROL ?? 'postgres://civica:civica@localhost:54329/civica_dev';
const pool = new pg.Pool({ connectionString, ssl: resolvePgSsl(connectionString) });

export const controlDb = drizzle(pool, { schema });
export { pool as controlPool };
