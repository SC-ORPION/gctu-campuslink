import { supabase } from '@/lib/supabase';
import HostelDetailClient from './HostelDetailClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: hostel } = await supabase
    .from('hostels')
    .select('name, location_name, campus')
    .eq('id', params.id)
    .single();

  if (!hostel) return { title: 'Hostel Not Found' };

  return {
    title: `${hostel.name} | GCTU Hostel Booking`,
    description: `Book your stay at ${hostel.name} in ${hostel.location_name}, ${hostel.campus} campus. Verified student accommodation.`,
    openGraph: {
      title: `${hostel.name} - CampusLink`,
      description: `Secure student housing at GCTU.`,
      type: 'website',
    },
  };
}

async function getHostel(id: string) {
  const { data, error } = await supabase
    .from('hostels')
    .select('*, rooms(*)')
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  return data;
}

export default async function HostelDetailPage({ params }: Props) {
  const hostel = await getHostel(params.id);

  if (!hostel) {
    notFound();
  }

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: hostel.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: hostel.location_name,
      addressRegion: hostel.campus,
    },
    description: hostel.description,
    image: hostel.images?.[0],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="animate-fade-in">
        <HostelDetailClient hostel={hostel} />
      </div>
    </>
  );
}
