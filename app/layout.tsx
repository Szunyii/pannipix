import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Offside } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const displayFont = Offside({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

const TITLE = "Pannipix";
const DESCRIPTION =
  "Vonal, forma, kifejezés — egyedi tetoválások, amelyek a te történetedet mesélik el. Nézd meg a munkáimat és foglalj időpontot.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "pannipix",
    locale: "hu_HU",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body className={`${displayFont.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
