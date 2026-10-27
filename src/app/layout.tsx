import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArmorCut PPF | PlusCars Detailing - Control de Stock & Cortes',
  description: 'Sistema monolítico de gestión de stock de bobinas de PPF y cortes para vehículos en PlusCars Detailing.',
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
      <body>{children}</body>
    </html>
  );
}
