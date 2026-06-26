import { ShieldCheck, Activity, ClipboardCheck } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';
import { CardTitle, CardDescription, Logo } from '@civica/ui';

const FEATURES = [
  { icon: Activity, text: 'EMR, scheduling, inventory, billing, and more — all in one place' },
  { icon: ShieldCheck, text: 'Role-based access controls built for clinical teams' },
  { icon: ClipboardCheck, text: 'A complete audit trail your clinic can rely on' },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--brand-teal)] via-[var(--accent)] to-[var(--navy)] p-12 text-white lg:flex">
        <div className="inline-flex w-fit rounded-2xl bg-white/95 p-4 shadow-lg">
          <Logo size="auth" />
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight">One login for your whole clinic toolkit.</h1>
          <ul className="mt-6 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-white/85">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} Civica Health</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-[var(--bg)] px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 justify-center lg:hidden" size="auth" />
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg shadow-slate-200/60">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription className="mb-6">Access your clinic dashboard.</CardDescription>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
