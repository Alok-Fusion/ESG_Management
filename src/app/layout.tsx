import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoSphere — ESG Management Platform",
  description: "Gamified ESG (Environmental, Social, Governance) Management Platform for sustainable business operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
