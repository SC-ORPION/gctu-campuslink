import './global.css';
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
  title: 'GCTU CampusLink — Ghana Communication Technology University Hostel Booking Portal',
  description: 'Apply for verified premium student housing and accommodation at GCTU (Ghana Communication Technology University). Real-time room availability, transaction-safe booking, and instant bed slot allocation.',
  keywords: 'GCTU hostels, CampusLink, GCTU Campus Link, student accommodation Accra, Tesano hostels, Ghana Communication Technology University, GCTU hostel booking portal, GCTU student portal, GCTU room allocation, premium student housing Ghana, Accra campus halls',
  icons: {
    icon: '/assets/gctu-logo.png',
    apple: '/assets/gctu-logo.png',
  },
  openGraph: {
    title: 'GCTU CampusLink — Premium Student Accommodation Portal',
    description: 'Apply for verified premium student housing and accommodation at Ghana Communication Technology University (GCTU).',
    type: 'website',
    url: 'https://hostels.gctu.edu.gh',
    siteName: 'GCTU CampusLink',
    images: [
      {
        url: '/assets/gctu-gate.jpg',
        width: 1200,
        height: 630,
        alt: 'GCTU CampusLink Portal',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans">
        <AppProviders>
          <AppShell>
            {children}
          </AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
