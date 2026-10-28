import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Strata",
  description: "Hobby open-source work and project management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${newsreader.variable}`}>
      <body
        style={
          {
            "--font-body": "var(--font-plus-jakarta), Segoe UI, sans-serif",
            "--font-display": "var(--font-newsreader), Georgia, serif",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
