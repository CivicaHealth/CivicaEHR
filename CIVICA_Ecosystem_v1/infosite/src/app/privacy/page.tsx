import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-[var(--navy)]">Privacy Policy</h1>
      <p className="mt-6 text-[var(--text-secondary)]">
        Our full privacy policy is coming soon. For questions in the meantime, contact us
        at civicahealth@gmail.com.
      </p>
    </div>
  );
}
