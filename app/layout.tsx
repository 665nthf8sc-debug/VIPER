import type { Metadata } from "next";
import { Orbitron, Press_Start_2P, Rajdhani } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const rajdhani = Rajdhani({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
});

const press = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press",
});

export const metadata: Metadata = {
  title: "VIPER3384 ARCADE",
  description:
    "Walkable Paper Mario 2.5D arcade: VIPER DROP, VIPER FPS, Crossing, Snake, Defender.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${rajdhani.variable} ${press.variable} dark h-full`}
    >
      <body className="h-full overflow-hidden antialiased">{children}</body>
    </html>
  );
}
