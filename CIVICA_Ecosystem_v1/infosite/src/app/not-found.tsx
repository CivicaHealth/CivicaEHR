import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
        404
      </span>
      <h1 className="mt-3 text-3xl font-bold text-[var(--navy)] sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-4 text-[var(--text-secondary)]">
        The page you&apos;re looking for may have moved or doesn&apos;t exist. Let&apos;s
        get you back on track.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-[var(--navy)]"
      >
        Back to home
      </Link>
    </div>
  );
}
