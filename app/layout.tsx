import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Web ZIP Archiver — Ubah Website Menjadi Arsip ZIP',
  description:
    'Arsipkan situs web publik apa pun menjadi satu file ZIP yang dapat diunduh — lengkap dengan aset dan struktur foldernya. Gratis, tanpa akun, tanpa instalasi.',
  metadataBase: new URL('https://web-zip-archiver.pages.dev'),
  openGraph: {
    title: 'Web ZIP Archiver — Ubah Website Menjadi Arsip ZIP',
    description:
      'Arsipkan situs web publik apa pun menjadi satu file ZIP yang dapat diunduh. Gratis, tanpa akun, tanpa instalasi.',
    type: 'website',
    url: 'https://web-zip-archiver.pages.dev',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Web ZIP Archiver — ubah website menjadi arsip ZIP',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web ZIP Archiver — Ubah Website Menjadi Arsip ZIP',
    description:
      'Arsipkan situs web publik apa pun menjadi satu file ZIP yang dapat diunduh. Gratis, tanpa akun, tanpa instalasi.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased text-zinc-900 bg-zinc-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
