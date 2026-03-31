import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import { AuthProvider } from "@/contexts/authContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Tabrova — QR Ordering System for Restaurants',
  description: 'Let customers scan, order and pay from their table. No app needed. Free to start.',
  keywords: 'restaurant QR ordering, table ordering system, restaurant management',

  metadataBase: new URL('https://tabrova.com'), // ✅ Required for absolute OG URLs

  openGraph: {
    title: 'Tabrova — QR Ordering for Restaurants',
    description: 'Let customers scan, order and pay from their table.',
    url: 'https://tabrova.com',
    siteName: 'Tabrova',
    type: 'website',
    images: [                                       // ✅ OG image (critical for link previews)
      {
        url: '/tabrova-logo.png',                       // 1200×630px recommended
        width: 1200,
        height: 630,
        alt: 'Tabrova QR Ordering System',
      },
    ],
  },

  twitter: {                                        // ✅ Twitter/X card
    card: 'summary_large_image',
    title: 'Tabrova — QR Ordering for Restaurants',
    description: 'Let customers scan, order and pay from their table.',
    images: ['/og-image.png'],
  },

  robots: {                                         // ✅ Search engine directives
    index: true,
    follow: true,
  },

  alternates: {
    canonical: 'https://tabrova.com',           // ✅ Prevents duplicate content issues
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ReduxProvider>
            {children}
          </ReduxProvider>
        </AuthProvider>
       
      </body>
    </html>
  );
}
