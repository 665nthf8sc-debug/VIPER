import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const press = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press",
});

const vt = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt",
});

export const metadata: Metadata = {
  title: "TILTED TOWERS MEMORIAL — VIPER3384",
  description:
    "An 8-bit memorial for Tilted Towers. Watch VIPER3384, dodge the meteor, and enter the arcade hall of fame.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${press.variable} ${vt.variable} dark h-full`}
    >
      <body className="flex min-h-full flex-col font-vt antialiased">
        {children}
      </body>
    </html>
  );
}
