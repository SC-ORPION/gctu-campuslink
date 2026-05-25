'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import HostelCard from '@/components/HostelCard';
import { Hostel } from '@/types';

interface HostelsClientProps {
  initialHostels: Hostel[];
}

export default function HostelsClient({ initialHostels }: HostelsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    amenities: {
      ac: false,
      wifi: false,
      kitchen: false
    }
  });

  const filteredHostels = useMemo(() => {
    return initialHostels.filter(hostel => {
      const matchesSearch = hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            hostel.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const hasAC = !filters.amenities.ac || hostel.rooms?.some(r => r.ac_available);
      const hasWifi = !filters.amenities.wifi || hostel.rooms?.some(r => r.wifi_available);
      const hasKitchen = !filters.amenities.kitchen || hostel.rooms?.some(r => r.kitchen_available);
      
      return matchesSearch && hasAC && hasWifi && hasKitchen;
    });
  }, [initialHostels, searchTerm, filters]);

  const toggleAmenity = (amenity: keyof typeof filters.amenities) => {
    setFilters(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity]
      }
    }));
  };

  return (
    <div className="hostels-page">
      <section className="search-section py-12 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 p-2 bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="text-gray-400 ml-2" size={20} />
              <input 
                type="text" 
                placeholder="Search by hostel name or location..." 
                className="flex-1 bg-transparent border-none outline-none py-3 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Filter size={18} />
                <span>Filters</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="max-w-3xl mx-auto mt-6 bg-white rounded-2xl border border-gray-200 p-6 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Amenities</h4>
                    <div className="flex flex-wrap gap-3">
                      {(['ac', 'wifi', 'kitchen'] as const).map((amenity) => (
                        <button
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            filters.amenities[amenity] 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {amenity.toUpperCase()} Available
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => {
                      setFilters({ amenities: { ac: false, wifi: false, kitchen: false } });
                      setSearchTerm('');
                    }}
                    className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="py-16 bg-gray-50 min-h-[60vh]">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-center">
            <p className="text-gray-500 font-medium">{filteredHostels.length} hostels found</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHostels.map(hostel => (
              <HostelCard key={hostel.id} hostel={hostel} />
            ))}
          </div>

          {filteredHostels.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 max-w-lg mx-auto shadow-sm">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">No results found</h3>
              <p className="text-gray-500 mb-8">We couldn't find any hostels matching your criteria.</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ amenities: { ac: false, wifi: false, kitchen: false } });
                }}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
