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
      <div className="premium-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="status-badge info">
            GCTU Accommodations
          </span>
          <h1 className="premium-card-title mt-3">Explore Hostel Listings</h1>
          <p className="text-sm font-medium text-[#64748B] mt-1">Find verified student housing near Tesano and Abeka campuses.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter size={16} />
            <span>Operational Filters</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Search Box & Filter Panel */}
      <div className="premium-card space-y-4">
        <div className="relative flex items-center border border-[#E2E8F0] rounded-xl bg-white focus-within:ring-2 focus-within:ring-[#1D4ED8]/20 focus-within:border-[#1D4ED8] transition-all">
          <Search className="text-[#94A3B8] ml-4 flex-shrink-0" size={18} />
          <input 
            type="text" 
            placeholder="Search by hostel name, neighborhood, landmarks..." 
            className="w-full bg-transparent border-none outline-none py-3.5 px-3 text-sm text-[#0F172A] placeholder-[#94A3B8] font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-2 mr-2 text-[#94A3B8] hover:text-[#475569]">
              <X size={16} />
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 text-left">
                {/* Gender rules */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Gender Rules</label>
                  <select 
                    value={filters.gender}
                    onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                    className="form-input"
                  >
                    <option value="ALL">All Genders Supported</option>
                    <option value="MIXED">Mixed Hostels</option>
                    <option value="MALE_ONLY">Male Only</option>
                    <option value="FEMALE_ONLY">Female Only</option>
                  </select>
                </div>

                {/* Campus zones */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Campus Zone</label>
                  <select 
                    value={filters.campus}
                    onChange={(e) => setFilters(prev => ({ ...prev, campus: e.target.value }))}
                    className="form-input"
                  >
                    <option value="ALL">All Campus Zones</option>
                    <option value="TESANO">Tesano Main/South</option>
                    <option value="ABEKA">Abeka Campus</option>
                  </select>
                </div>

                {/* Maximum Price */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    <span>Max Price Per Year</span>
                    <span className="text-[#1D4ED8]">GH₵{filters.maxPrice}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1500" 
                    max="5000" 
                    step="100"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#1D4ED8] mt-2"
                  />
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <input 
                    type="checkbox" 
                    id="onlyAvailable"
                    checked={filters.onlyAvailable}
                    onChange={(e) => setFilters(prev => ({ ...prev, onlyAvailable: e.target.checked }))}
                    className="w-5 h-5 text-[#1D4ED8] bg-white border-[#CBD5E1] rounded focus:ring-[#1D4ED8]"
                  />
                  <label htmlFor="onlyAvailable" className="text-sm font-semibold text-[#0F172A] cursor-pointer select-none">
                    Show Only Available Beds
                  </label>
                </div>
              </div>

              {/* Amenities block */}
              <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-left">
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Specific Amenities</h4>
                <div className="flex flex-wrap gap-3">
                  {(['ac', 'wifi', 'kitchen'] as const).map((amenity) => (
                    <button
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        filters.amenities[amenity] 
                        ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]' 
                        : 'bg-white border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {amenity.toUpperCase()} Available
                    </button>
                  ))}
                  <button 
                    onClick={clearAllFilters}
                    className="ml-auto text-xs font-bold text-[#DC2626] hover:text-[#991B1B] transition-colors uppercase tracking-wider"
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
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#CBD5E1] max-w-lg mx-auto shadow-sm p-8">
            <ShieldAlert className="text-[#D97706] mx-auto mb-4 animate-pulse" size={40} />
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">No Matching Residences</h3>
            <p className="text-sm text-[#64748B] max-w-xs mx-auto leading-relaxed mb-8">
              We couldn't find any student hostels matching your current search parameters. Try adjusting your price boundaries or gender options.
            </p>
            <button 
              onClick={clearAllFilters}
              className="btn btn-secondary"
            >
              Reset Operational Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
