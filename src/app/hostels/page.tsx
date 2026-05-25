import { supabase } from '@/lib/supabase';
import HostelsClient from './HostelsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Hostels | CampusLink GCTU',
  description: 'Explore verified student hostels near GCTU campus. Filter by price, amenities, and gender rules.',
};

export const revalidate = 60; // Revalidate every minute

async function getHostels() {
  const { data, error } = await supabase
    .from('hostels')
    .select('*, rooms(*)');
  
  if (error) {
    console.error('Error fetching hostels:', error);
    return [];
  }
  
  return data || [];
}

export default async function HostelsPage() {
  const hostels = await getHostels();

  return (
    <div className="animate-fade-in">
      <div className="bg-primary py-12 text-center text-white">
        <h1 className="text-4xl font-extrabold mb-2">Hostel Listings</h1>
        <p className="text-primary-foreground/80 opacity-80">Find your next home away from home</p>
      </div>
      <HostelsClient initialHostels={hostels} />
    </div>
  );
}
