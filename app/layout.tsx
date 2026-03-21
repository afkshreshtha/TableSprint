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

// In your app/layout.tsx or landing page
export const metadata = {
  title: 'TableSprint — QR Ordering System for Restaurants',
  description: 'Let customers scan, order and pay from their table. No app needed. Free to start.',
  keywords: 'restaurant QR ordering, table ordering system, restaurant management',
  openGraph: {
    title: 'TableSprint — QR Ordering for Restaurants',
    description: 'Let customers scan, order and pay from their table.',
    url: 'https://tablesprint.com',
    siteName: 'TableSprint',
    type: 'website',
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
