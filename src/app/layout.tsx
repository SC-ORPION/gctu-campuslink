import '../index.css';
import { Inter, Outfit } from 'next/font/google';
import { AppProviders } from '../providers/AppProviders';
import AppShell from '../components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata = {
  title: 'CampusLink — GCTU Academic Accommodations',
  description: 'Apply for verified premium student housing and accommodation at GCTU. Instant allocation, transaction-safe booking, and complete operational tracking.',
  keywords: 'GCTU hostels, CampusLink, student accommodation, Accra campus halls',
  openGraph: {
    title: 'CampusLink — GCTU Academic Accommodations',
    description: 'Apply for verified premium student housing and accommodation at GCTU.',
    type: 'website',
    url: 'https://hostels.gctu.edu.gh',
    siteName: 'GCTU CampusLink',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[#F5F7FB] text-[#475569] font-sans">
        <AppProviders>
          <AppShell>
            {children}
          </AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
