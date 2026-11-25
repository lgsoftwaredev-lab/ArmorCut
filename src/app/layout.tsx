import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ArmorCut PPF | PlusCars Detailing — Gestión de Stock & Precorte',
  description:
    'Plataforma técnica de control de inventario de bobinas PPF, órdenes de corte y configurador 3D.',
  icons: {
    icon: '/brand/pluscars-monogram.png',
    apple: '/brand/pluscars-monogram.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#090a0d',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
