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
  title: "VIPER3384 DROP ZONE",
  description:
    "VIPER3384's Fortnite hub: VIPER DROP, Tilted plaza, 3D Island Drop, and VIPER FPS raycast.",
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
