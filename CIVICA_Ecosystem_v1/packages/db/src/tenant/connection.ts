import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { eq } from 'drizzle-orm';
import { loadEnvLocal } from '@civica/config';
import { controlDb } from '../control/client';
import { clinics } from '../control/schema';
import { resolvePgSsl } from '../ssl';
import * as schema from './schema';

loadEnvLocal(process.cwd());

export type TenantDb = NodePgDatabase<typeof schema>;
const cache = new Map<string, TenantDb>();

export function getTenantDb(databaseIdentifier: string): TenantDb {
  const template = process.env.TENANT_DATABASE_URL_TEMPLATE ?? 'postgres://civica:civica@localhost:54329/{database}';
  const connectionString = template.replace('{database}', databaseIdentifier);
  let db = cache.get(connectionString);
  if (!db) {
    const pool = new pg.Pool({ connectionString, ssl: resolvePgSsl(connectionString) });
    db = drizzle(pool, { schema });
    cache.set(connectionString, db);
  }
  return db;
}

export async function getTenantDbByClinicId(clinicId: string): Promise<TenantDb> {
  const clinic = await controlDb.query.clinics.findFirst({ where: eq(clinics.id, clinicId) });
  if (!clinic) throw new Error(`Clinic not found: ${clinicId}`);
  return getTenantDb(clinic.dbIdentifier);
}
