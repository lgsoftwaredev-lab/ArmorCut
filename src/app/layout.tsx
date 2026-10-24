import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArmorCut PPF | PlusCars Detailing - Control de Stock & Mermas',
  description: 'Sistema monolítico de gestión de stock de bobinas de PPF, cortes en vehículos, control de scrap y banco de retazos aprovechables.',
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
