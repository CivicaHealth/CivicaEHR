import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Civica Health | Software Infrastructure for Clinics",
    template: "%s | Civica Health",
  },
  description:
    "Civica Health builds security-conscious software infrastructure for clinics, student-run clinics, and free clinics — covering EMR, roster, inventory, and patient follow-up workflows.",
  keywords: [
    "Civica Health",
    "clinic software",
    "student-run clinic software",
    "free clinic operations",
    "clinic volunteer coordination",
    "patient follow-up workflows",
    "healthcare operations platform",
    "HIPAA-ready infrastructure",
  ],
  openGraph: {
    title: "Civica Health | Software Infrastructure for Clinics",
    description:
      "Civica Health builds security-conscious software infrastructure for clinics, student-run clinics, and free clinics.",
    url: SITE_URL,
    siteName: "Civica Health",
    type: "website",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2d8c92",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Civica Health",
  url: SITE_URL,
  logo: `${SITE_URL}/CIVICA_logo_transparent.png`,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Civica Health",
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
