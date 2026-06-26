import type { PersonRole } from '@civica/db/tenant/schema';

export const PERSON_ROLES: PersonRole[] = ['preceptor', 'med_student', 'scribe', 'translator', 'shadow'];

export const PERSON_ROLE_LABELS: Record<PersonRole, string> = {
  preceptor: 'Preceptor',
  med_student: 'Med student',
  scribe: 'Scribe',
  translator: 'Translator',
  shadow: 'Shadow',
};
