import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OutboxFlusher } from "@/components/OutboxFlusher";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "House Monsters",
  description: "Snap an abandoned house, catch its monster, and report it to Birmingham 311.",
  appleWebApp: { capable: true, title: "House Monsters", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f4ead5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">{children}</main>
        <ServiceWorkerRegistrar />
        <OutboxFlusher />
      </body>
    </html>
  );
}
