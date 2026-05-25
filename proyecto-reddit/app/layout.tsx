import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reddit Replica",
  description: "Reddit Replica App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="flex items-center px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-50">
          <Image
            src="/icon.png"
            alt="Logo"
            width={48}
            height={48}
            priority
            style={{ borderRadius: '8px' }}
          />
        </header>
        {children}
      </body>
    </html>
  );
}