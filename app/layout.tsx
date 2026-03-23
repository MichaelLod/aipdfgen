import type { Metadata } from 'next';
import './globals.css';

const title = 'Free AI PDF Generator — Create Any PDF with AI Online';
const description =
  'Free online AI PDF generator. Create professional invoices, resumes, certificates, reports, letters, and any document with AI. No sign-up, no server costs — bring your own API key. Works with ChatGPT, Claude, Gemini, and 15+ AI models. Upload images, iterate in real-time, download as PDF instantly.';

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'free pdf generator',
    'ai pdf generator',
    'free ai pdf maker',
    'create pdf with ai',
    'ai document generator',
    'free invoice generator',
    'free resume generator',
    'ai resume maker',
    'ai invoice maker',
    'pdf creator online free',
    'ai certificate generator',
    'ai report generator',
    'chatgpt pdf',
    'claude pdf',
    'gemini pdf',
    'html to pdf',
    'online pdf maker',
    'free document creator',
    'ai letter writer',
    'byoky',
  ],
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  metadataBase: new URL('https://rnrh.app'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Free AI PDF Generator — Invoices, Resumes, Reports & More',
    description:
      'Create any PDF with AI for free. Professional invoices, resumes, certificates, and more. No sign-up needed — use your own API key.',
    type: 'website',
    url: 'https://rnrh.app',
    siteName: 'Free AI PDF Generator',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI PDF Generator — Create Any PDF with AI',
    description:
      'Create professional PDFs with AI for free. Invoices, resumes, certificates, reports — no sign-up, no limits.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  other: {
    'google-site-verification': '',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Free AI PDF Generator',
  url: 'https://rnrh.app',
  description,
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'AI-powered PDF generation',
    'Invoice creation',
    'Resume builder',
    'Certificate generator',
    'Report maker',
    'Image upload support',
    'Real-time preview',
    '15+ AI models supported',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
