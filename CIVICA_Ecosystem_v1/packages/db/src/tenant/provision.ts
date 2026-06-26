import pg from 'pg';
import { getTenantDb } from './connection';
import { createTenantSchema } from '../scripts/schema-sql';

function adminUrl() {
  const url = new URL(process.env.DATABASE_URL_CONTROL ?? 'postgres://civica:civica@localhost:54329/civica_dev');
  url.pathname = '/postgres';
  return url.toString();
}

export async function provisionTenantDatabase(dbIdentifier: string) {
  const client = new pg.Client({ connectionString: adminUrl() });
  await client.connect();
  const exists = await client.query('select 1 from pg_database where datname=$1', [dbIdentifier]);
  if (exists.rowCount === 0) await client.query(`create database "${dbIdentifier}"`);
  await client.end();
  await createTenantSchema(getTenantDb(dbIdentifier));
}
