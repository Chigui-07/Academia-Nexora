import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academia Nexora",
  description: "Una academia para aprender, avanzar y divertirse.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
