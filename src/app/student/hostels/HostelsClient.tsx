'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, SlidersHorizontal, Info, Compass, ShieldAlert } from 'lucide-react';
import HostelCard from '@/components/HostelCard';
import { Hostel } from '@/types';

interface HostelsClientProps {
  initialHostels: Hostel[];
}

export default function HostelsClient({ initialHostels }: HostelsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: 'ALL', // 'ALL' | 'MIXED' | 'MALE_ONLY' | 'FEMALE_ONLY'
    campus: 'ALL', // 'ALL' | 'TESANO' | 'ABEKA'
    maxPrice: 5000,
    onlyAvailable: false,
    amenities: {
      ac: false,
      wifi: false,
      kitchen: false
    }
  });

  // Real dynamic hostels list loaded from database
  const hostelsList = useMemo(() => {
    return initialHostels || [];
  }, [initialHostels]);

  const filteredHostels = useMemo(() => {
    return hostelsList.filter(hostel => {
      const matchesSearch = hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            hostel.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGender = filters.gender === 'ALL' || hostel.gender_rule === filters.gender;
      
      const matchesCampus = filters.campus === 'ALL' || 
                            (filters.campus === 'TESANO' && hostel.campus?.includes('TESANO')) ||
                            (filters.campus === 'ABEKA' && hostel.campus?.includes('ABEKA'));
      
      const hostelPrices = hostel.rooms?.map((r: any) => r.price) || [0];
      const minPrice = hostelPrices.length > 0 ? Math.min(...hostelPrices) : 0;
      const matchesPrice = minPrice <= filters.maxPrice;
      
      const hasAC = !filters.amenities.ac || hostel.rooms?.some((r: any) => r.ac_available);
      const hasWifi = !filters.amenities.wifi || hostel.rooms?.some((r: any) => r.wifi_available);
      const hasKitchen = !filters.amenities.kitchen || hostel.rooms?.some((r: any) => r.kitchen_available);
      
      const matchesAvailability = !filters.onlyAvailable || 
        hostel.rooms?.some((r: any) => (r.capacity - (r.current_occupancy || 0)) > 0);
      
      return matchesSearch && matchesGender && matchesCampus && matchesPrice && hasAC && hasWifi && hasKitchen && matchesAvailability;
    });
  }, [hostelsList, searchTerm, filters]);

  const toggleAmenity = (amenity: keyof typeof filters.amenities) => {
    setFilters(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity]
      }
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      gender: 'ALL',
      campus: 'ALL',
      maxPrice: 5000,
      onlyAvailable: false,
      amenities: { ac: false, wifi: false, kitchen: false }
    });
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="badge badge-blue">
            GCTU Accommodations
          </span>
          <h1 className="text-xl font-black text-slate-900 dark:text-zinc-50 mt-2">Explore Hostel Listings</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Find verified student housing near Tesano and Abeka campuses.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400' : 'bg-white dark:bg-zinc-900 border-[#1e5faf]/15 dark:border-zinc-800 text-slate-200 dark:text-zinc-300 hover:bg-[#06182e]/40 dark:hover:bg-zinc-800/80'}`}
          >
            <Filter size={14} />
            <span>Operational Filters</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Search Box & Filter Panel */}
      <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-[#1e5faf]/15 dark:border-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
        <div className="relative flex items-center border border-[#1e5faf]/15 dark:border-zinc-800 rounded-xl bg-[#06182e]/40 dark:bg-zinc-900/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <Search className="text-slate-400 dark:text-zinc-500 ml-4 flex-shrink-0" size={18} />
          <input 
            type="text" 
            placeholder="Search by hostel name, neighborhood, landmarks..." 
            className="w-full bg-transparent border-none outline-none py-3 px-3 text-xs text-white dark:text-zinc-100 placeholder-slate-400 font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-1 mr-3 text-slate-400 hover:text-slate-650">
              <X size={14} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[#1e5faf]/15 dark:border-zinc-900 pt-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 text-left">
                {/* Gender rules */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Gender Rules</label>
                  <select 
                    value={filters.gender}
                    onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full bg-[#06182e]/40 dark:bg-zinc-900 border border-[#1e5faf]/15 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 dark:text-zinc-300 focus:outline-none"
                  >
                    <option value="ALL">All Genders Supported</option>
                    <option value="MIXED">Mixed Hostels</option>
                    <option value="MALE_ONLY">Male Only</option>
                    <option value="FEMALE_ONLY">Female Only</option>
                  </select>
                </div>

                {/* Campus zones */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Campus Zone</label>
                  <select 
                    value={filters.campus}
                    onChange={(e) => setFilters(prev => ({ ...prev, campus: e.target.value }))}
                    className="w-full bg-[#06182e]/40 dark:bg-zinc-900 border border-[#1e5faf]/15 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 dark:text-zinc-300 focus:outline-none"
                  >
                    <option value="ALL">All Campus Zones</option>
                    <option value="TESANO">Tesano Main/South</option>
                    <option value="ABEKA">Abeka Campus</option>
                  </select>
                </div>

                {/* Maximum Price */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    <span>Max Price Per Year</span>
                    <span className="text-indigo-600 dark:text-indigo-400">GH₵{filters.maxPrice}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1500" 
                    max="5000" 
                    step="100"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                  />
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center gap-2 pt-5 md:pt-4">
                  <input 
                    type="checkbox" 
                    id="onlyAvailable"
                    checked={filters.onlyAvailable}
                    onChange={(e) => setFilters(prev => ({ ...prev, onlyAvailable: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 bg-[#0f3058]/30 border-slate-300 rounded focus:ring-indigo-500 dark:bg-zinc-900 dark:border-zinc-800"
                  />
                  <label htmlFor="onlyAvailable" className="text-xs font-bold text-slate-200 dark:text-zinc-300 cursor-pointer select-none">
                    Show Only Available Beds
                  </label>
                </div>
              </div>

              {/* Amenities block */}
              <div className="mt-5 pt-4 border-t border-[#1e5faf]/15 dark:border-zinc-900 text-left">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Specific Amenities</h4>
                <div className="flex flex-wrap gap-2.5">
                  {(['ac', 'wifi', 'kitchen'] as const).map((amenity) => (
                    <button
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        filters.amenities[amenity] 
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400' 
                        : 'bg-[#06182e]/40 dark:bg-zinc-900 border-[#1e5faf]/15 dark:border-zinc-800 text-slate-650 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {amenity.toUpperCase()} Available
                    </button>
                  ))}
                  <button 
                    onClick={clearAllFilters}
                    className="ml-auto text-xs font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Hostels Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-left">
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            Showing {filteredHostels.length} of {hostelsList.length} registered residences
          </p>
        </div>
        
        {filteredHostels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHostels.map(hostel => (
              <HostelCard key={hostel.id} hostel={hostel} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-[#1e5faf]/15 dark:border-zinc-900 max-w-lg mx-auto shadow-[0_4px_24px_rgba(0,0,0,0.3)] p-8">
            <ShieldAlert className="text-amber-500 mx-auto mb-4 animate-pulse" size={32} />
            <h3 className="text-sm font-black text-white dark:text-zinc-200 mb-1">No Matching Residences</h3>
            <p className="text-xs text-slate-450 dark:text-zinc-550 max-w-xs mx-auto leading-relaxed mb-6">
              We couldn't find any student hostels matching your current search parameters. Try adjusting your price boundaries or gender options.
            </p>
            <button 
              onClick={clearAllFilters}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-colors"
            >
              Reset Operational Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
