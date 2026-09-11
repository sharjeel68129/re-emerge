import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Registrar — a four-year log",
  description: "Track daily, weekly, monthly, semester, yearly, and pre-graduation goals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body className="font-sans">{children}</body>
    </html>
  );
}
