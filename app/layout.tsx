import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Free AI PDF Generator — Create Any PDF with AI',
  description:
    'Create professional PDFs with AI using your own API keys. No server costs, no limits, no account needed. Upload images, design documents, generate reports — all in your browser.',
  openGraph: {
    title: 'Free AI PDF Generator',
    description: 'Create any PDF with AI. Your keys, zero cost.',
    type: 'website',
    url: 'https://rnrh.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI PDF Generator',
    description: 'Create any PDF with AI. Your keys, zero cost.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
