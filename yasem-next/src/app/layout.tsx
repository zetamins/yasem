import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YASEM — Yet Another Stb EMulator",
  description: "IPTV Set-Top-Box emulator for web browsers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
