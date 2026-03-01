import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Exchange",
  description: "Paper derivatives trading: order book, place order, positions",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
