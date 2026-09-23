import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nexus Mafia Creator Network | NMCN",
  description:
    "Nexus Mafia Creator Network LLC - Full-service creator management agency. Battle exchange platform, creator training, and personalized management for TikTok LIVE creators.",
  keywords: [
    "NMCN",
    "Nexus Mafia",
    "Creator Network",
    "TikTok LIVE",
    "Battle Exchange",
    "Creator Management",
    "TikTok Agency",
  ],
  openGraph: {
    title: "Nexus Mafia Creator Network",
    description: "Build Your Empire With The Right Family",
    url: "https://nexusmafiaagency.com",
    siteName: "NMCN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-screen font-body antialiased">
        <Navbar />
        <main className="relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
