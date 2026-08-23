import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'digi-carts Super Admin',
  description: 'digi-carts Super Admin Dashboard',
  manifest: '/manifest.json',
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'digi-carts' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        {apiUrl && <meta name="x-api-url" content={apiUrl} />}
      </head>
      <body className="min-h-full flex flex-col bg-neutral-50">{children}</body>
    </html>
  );
}
