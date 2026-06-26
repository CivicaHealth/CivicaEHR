import { config } from 'dotenv';
import { Client } from 'pg';
import { resolvePgSsl } from '@civica/db/ssl';

config({ path: '.env.local' });

/**
 * Creates the local "civica_control" database and the demo clinic's tenant
 * database ("civica_clinic_demo") if they do not already exist. Connects to
 * the "postgres" maintenance database using the same credentials as
 * DATABASE_URL_CONTROL.
 */

function dbNameFromUrl(url: string): string {
  return new URL(url).pathname.replace(/^\//, '');
}

function maintenanceUrl(url: string): string {
  const parsed = new URL(url);
  parsed.pathname = '/postgres';
  return parsed.toString();
}

async function ensureDatabase(adminUrl: string, dbName: string) {
  const client = new Client({ connectionString: adminUrl, ssl: resolvePgSsl(adminUrl) });
  await client.connect();
  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (result.rowCount === 0) {
      // Database names cannot be parameterized; dbName is validated below.
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database "${dbName}"`);
    } else {
      console.log(`Database "${dbName}" already exists`);
    }
  } finally {
    await client.end();
  }
}

function assertSafeDbName(name: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe database name: ${name}`);
  }
}

async function main() {
  const controlUrl = process.env.DATABASE_URL_CONTROL;
  const tenantTemplate = process.env.TENANT_DATABASE_URL_TEMPLATE;
  if (!controlUrl) throw new Error('DATABASE_URL_CONTROL is not set');
  if (!tenantTemplate) throw new Error('TENANT_DATABASE_URL_TEMPLATE is not set');

  const adminUrl = maintenanceUrl(controlUrl);

  const controlDbName = dbNameFromUrl(controlUrl);
  assertSafeDbName(controlDbName);
  await ensureDatabase(adminUrl, controlDbName);

  const demoDbName = 'civica_clinic_demo';
  assertSafeDbName(demoDbName);
  await ensureDatabase(adminUrl, demoDbName);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Local DB setup failed:', err.message);
    process.exit(1);
  });
