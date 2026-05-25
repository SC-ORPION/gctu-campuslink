'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ShieldCheck, ChevronLeft, ChevronRight, MessageCircle, Phone, Info, Activity } from 'lucide-react';
import { Hostel } from '@/types';

interface HostelCardProps {
  hostel: Hostel;
}

export default function HostelCard({ hostel }: HostelCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const images = hostel.images || [];

  // Carousel cycle
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const getPriceRange = () => {
    if (!hostel.rooms || hostel.rooms.length === 0) return 'N/A';
    const prices = hostel.rooms.map(r => r.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `GH₵${min}` : `GH₵${min} - GH₵${max}`;
  };

  // Compute actual or mock occupancy details
  const getOccupancyStats = () => {
    if (!hostel.rooms || hostel.rooms.length === 0) {
      return { filled: 28, capacity: 40, percent: 70 };
    }
    let filled = 0;
    let capacity = 0;
    hostel.rooms.forEach(r => {
      filled += r.current_occupancy || 0;
      capacity += r.capacity || 4;
    });
    // Ensure fallback capacity
    if (capacity === 0) capacity = 40;
    const percent = Math.min(Math.round((filled / capacity) * 100), 100);
    return { filled, capacity, percent };
  };

  const { filled, capacity, percent } = getOccupancyStats();

  return (
    <motion.div 
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-250 flex flex-col justify-between"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 1. Carousel */}
      <div className="relative h-48 w-full bg-slate-50 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentImage}
            src={images[currentImage] || (hostel.name.toLowerCase().includes('gate') ? '/src/assets/gctu-gate.jpg' : hostel.name.toLowerCase().includes('admin') ? '/src/assets/gctu-admin.jpg' : hostel.name.toLowerCase().includes('reception') ? '/src/assets/gctu-reception.jpg' : '/src/assets/gctu-building.jpg')} 
            alt={hostel.name}
            className="h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        </AnimatePresence>
        
        {images.length > 1 && (
          <>
            <button 
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
              onClick={prevImage}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
              onClick={nextImage}
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-200 ${i === currentImage ? 'w-3 bg-white' : 'w-1 bg-white/50'}`} 
                />
              ))}
            </div>
          </>
        )}

        {hostel.status === 'OPEN' && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1 shadow-sm z-10">
            <ShieldCheck size={10} /> Verified
          </div>
        )}
        
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-slate-700 shadow-sm z-10 uppercase tracking-wide">
          {hostel.campus}
        </div>
      </div>

      {/* 2. Body Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                {hostel.name}
              </h3>
              <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                <MapPin size={12} className="text-primary" />
                <span className="text-xs font-semibold">{hostel.location_name}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-primary font-black text-sm">{getPriceRange()}</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Per Acad. Year</div>
            </div>
          </div>

          {/* Gender Rule Badge & Distance info */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
              hostel.gender_rule === 'MALE_ONLY' ? 'bg-blue-50 text-blue-600' :
              hostel.gender_rule === 'FEMALE_ONLY' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {hostel.gender_rule?.replace('_ONLY', '').replace('_', ' ') || 'MIXED'}
            </span>
            <span className="text-slate-200">•</span>
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
              <Info size={11} className="text-slate-400" /> {hostel.distance_from_campus || '1.0 km'}
            </span>
          </div>

          {/* Occupancy Indicator Progress Bar */}
          <div className="space-y-1 mb-5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Beds Occupied</span>
              <span>{filled} / {capacity} beds ({percent}%)</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 3. Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-50">
          <Link 
            href={`/hostels/${hostel.id}`}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs text-center hover:bg-slate-100 transition-colors"
          >
            View Details
          </Link>
          <Link 
            href={`/hostels/${hostel.id}`}
            className="bg-primary text-white py-2.5 rounded-xl font-bold text-xs text-center hover:bg-primary-hover transition-colors"
          >
            Select Hostel
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
