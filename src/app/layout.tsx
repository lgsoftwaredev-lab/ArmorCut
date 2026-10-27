import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArmorCut PPF | PlusCars Detailing - Control de Stock & Cortes',
  description: 'Sistema monolítico de gestión de stock de bobinas de PPF y cortes para vehículos en PlusCars Detailing.',
  icons: {
    icon: '/brand/pluscars-monogram.png',
    apple: '/brand/pluscars-monogram.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#060709',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="bg-brand-watermark" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
