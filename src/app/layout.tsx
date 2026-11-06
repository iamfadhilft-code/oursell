import type { Metadata } from 'next';
import './globals.css';
import { AppInitializer } from '@/components/common/AppInitializer';

export const metadata: Metadata = {
  title: 'OURSELL POS — Enterprise Retail & Restaurant Operating System',
  description:
    'A unified SaaS platform for high-speed sales, offline billing, multi-store inventory, Khata credit, and intelligent business analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <AppInitializer>{children}</AppInitializer>
      </body>
    </html>
  );
}
