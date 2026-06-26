import { eq, or } from 'drizzle-orm';
import { controlDb } from '@civica/db/control/client';
import { clinics } from '@civica/db/control/schema';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'clinic';
}

/**
 * Finds a slug/dbIdentifier pair for a new clinic that doesn't collide with
 * an existing one, appending a numeric suffix if needed. dbIdentifier must
 * match /^[a-zA-Z0-9_]+$/ (enforced by tenant provisioning scripts).
 */
export async function uniqueClinicIdentifiers(name: string): Promise<{ slug: string; dbIdentifier: string }> {
  const base = slugify(name);

  for (let attempt = 0; attempt < 50; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const dbIdentifier = `civica_clinic_${slug.replace(/-/g, '_')}`;

    const existing = await controlDb.query.clinics.findFirst({
      where: or(eq(clinics.slug, slug), eq(clinics.dbIdentifier, dbIdentifier)),
    });
    if (!existing) return { slug, dbIdentifier };
  }

  throw new Error('Could not generate a unique clinic identifier');
}
