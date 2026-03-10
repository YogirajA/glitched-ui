import type { Metadata } from "next";
import { Cormorant_Garamond, Nunito } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Glitched — Your Exit Protocol",
  description: "You didn't fail. The system did. Three questions. A real plan.",
  openGraph: {
    title: "Glitched — Your Exit Protocol",
    description: "You didn't fail. The system did. Three questions. A real plan.",
    url: "https://glitched.sh",
    siteName: "Glitched",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${nunito.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
