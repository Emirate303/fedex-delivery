import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FedEx Delivery | Shipping and Tracking",
  description:
    "shipping and delivery management platform.",
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