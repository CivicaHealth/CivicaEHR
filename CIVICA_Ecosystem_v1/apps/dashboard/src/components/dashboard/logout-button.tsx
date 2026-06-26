import { LogOut } from 'lucide-react';
import { logoutAction } from '@/server/actions/auth-actions';
import { Button } from '@civica/ui';

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="secondary">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Log out
      </Button>
    </form>
  );
}
