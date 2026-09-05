import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ArvenaNavbar from "@/components/arvena-navbar";
import { LanguageProvider } from "@/lib/i18n/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARVENA — Connected City Ecosystem",
  description:
    "ARVENA is a connected city ecosystem for circular resources, environmental impact, community intelligence, and smarter urban living.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#092328] text-white selection:bg-emerald-400/20 selection:text-emerald-200">
        <LanguageProvider>
          <ArvenaNavbar />
          <div className="min-h-screen pt-[68px] pb-16 lg:pb-0">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}