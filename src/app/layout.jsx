import '../index.css';
import { Outfit } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LayoutShell from '../components/LayoutShell';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata = {
  title: 'CampusLink - GCTU Hostel Management',
  description: 'Apply for verified student accommodation at GCTU. Secure, real-time hostel booking system.',
  openGraph: {
    title: 'CampusLink - GCTU Hostel Management',
    description: 'Apply for verified student accommodation at GCTU.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <AuthProvider>
          <LayoutShell>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
