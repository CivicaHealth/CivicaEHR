import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/CIVICA_logo_transparent.png"
        alt="Civica Health"
        width={160}
        height={48}
        priority
        className="h-10 w-auto object-contain"
      />
    </Link>
  );
}
