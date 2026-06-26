import { Building2, ClipboardCheck, Rocket } from 'lucide-react';
import { RegisterClinicForm } from '@/components/auth/register-clinic-form';
import { CardTitle, CardDescription, Logo } from '@civica/ui';

const STEPS = [
  { icon: Building2, text: 'Tell us about your clinic and choose a registration code' },
  { icon: ClipboardCheck, text: 'A Civica platform admin reviews and approves your clinic' },
  { icon: Rocket, text: 'Sign in and invite your staff using your clinic code' },
];

export default function RegisterClinicPage() {
  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--brand-orange)] via-[var(--accent)] to-[var(--navy)] p-12 text-white lg:flex">
        <div className="inline-flex w-fit rounded-2xl bg-white/95 p-4 shadow-lg">
          <Logo size="auth" />
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight">Bring your clinic onto Civica Health.</h1>
          <ol className="mt-6 space-y-4">
            {STEPS.map(({ icon: Icon, text }, index) => (
              <li key={text} className="flex items-start gap-3 text-white/85">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed">
                  <span className="font-medium text-white">Step {index + 1}.</span> {text}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} Civica Health</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-[var(--bg)] px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 justify-center lg:hidden" size="auth" />
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg shadow-slate-200/60">
            <CardTitle className="text-xl">Register your clinic</CardTitle>
            <CardDescription className="mb-6">
              Your clinic gets its own independent set of tools and data, separate from every
              other clinic on Civica. We&apos;ll review your submission before activating it.
            </CardDescription>
            <RegisterClinicForm />
          </div>
        </div>
      </div>
    </main>
  );
}
