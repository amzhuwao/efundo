import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AuthHydration } from '@/components/auth/AuthHydration';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://efundo.co.zw';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'eFundo — Past Papers, Notes & Practice Tests',
    template: '%s | eFundo',
  },
  description:
    'eFundo helps Zimbabwean students access past exam papers, lecture notes, textbooks, lessons, and practice tests — organized by institution and course.',
  keywords: [
    'past papers',
    'exam papers',
    'lecture notes',
    'Zimbabwe university',
    'study resources',
    'practice tests',
    'eFundo',
  ],
  authors: [{ name: 'eFundo' }],
  openGraph: {
    type: 'website',
    locale: 'en_ZW',
    siteName: 'eFundo',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthHydration>{children}</AuthHydration>
        </Providers>
      </body>
    </html>
  );
}
