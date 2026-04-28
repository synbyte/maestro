import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

import { Toaster } from "sonner";
import { NotificationsProvider } from "@/components/notifications-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maestro Mix | The Social Hub for Students",
  description: "Connect with peers, study together, and build community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We removed the generic Header here. It will only be shown on specific pages if desired.
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#121212] text-[#ecebe4]">
        <NotificationsProvider>
          <main className="flex-1 flex flex-col">
            {children}
            <Analytics />
          </main>
        </NotificationsProvider>
        <Toaster theme="dark" position="bottom-right" closeButton richColors />
      </body>
    </html>
  );
}
