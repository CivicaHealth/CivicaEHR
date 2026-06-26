import { exitClinicViewAction } from '@/server/actions/admin-actions';

export function ExitClinicViewButton() {
  return (
    <form action={exitClinicViewAction}>
      <button type="submit" className="underline underline-offset-2 hover:text-white/80">
        Exit
      </button>
    </form>
  );
}
