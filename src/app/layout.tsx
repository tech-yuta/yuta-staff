import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luna Staff",
  description: "Gestion du personnel du restaurant Luna",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Luna Staff",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/cropped-Logo-luna-32x32.png" sizes="32x32"></link>
        <link rel="icon" href="/cropped-Logo-luna-192x192.png" sizes="192x192"></link>
        <link rel="apple-touch-icon" href="/cropped-Logo-luna-180x180.png"></link>
      </head>
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
