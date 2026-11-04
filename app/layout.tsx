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
 title: 'Web to ZIP Archiver',
 description: 'Download websites as ZIP files by ',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
 return (
 <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
 <body className="font-sans antialiased text-zinc-900 bg-zinc-50" suppressHydrationWarning>
 {children}
 </body>
 </html>
 );
}
