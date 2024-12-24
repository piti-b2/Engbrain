import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from '@/context/LanguageContext';
import { Toaster } from "@/components/ui/toaster";
import '../lib/console-override';

const notoSansThai = Noto_Sans_Thai({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Engbrain",
  description: "Welcome to Engbrain",
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white',
          footerActionLink: 'text-blue-500 hover:text-blue-600'
        }
      }}
    >
      <html lang="en" className={notoSansThai.className}>
        <body className="antialiased" suppressHydrationWarning>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
