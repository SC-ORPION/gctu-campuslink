'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, ShieldCheck, ChevronLeft, ChevronRight, 
  MessageCircle, Phone, ArrowLeft, Wifi, Wind, 
  Utensils, Droplets, Shield, User, Bath, Maximize2, X, Loader2,
  Zap, Shirt, Monitor, Navigation, Video, Globe, AlertTriangle, Building2, Info
} from 'lucide-react';
import { Hostel } from '@/types';

interface HostelDetailClientProps {
  hostel: Hostel;
}

export default function HostelDetailClient({ hostel }: HostelDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const images = hostel.images || [];

  const nextImage = () => images.length > 0 && setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => images.length > 0 && setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  const handleSelectHostel = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setErrorMsg(null);
    setBookingLoading(true);
    try {
      const response = await fetch('/api/student/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          hostelId: hostel.id
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to select hostel.');
      }
      // Redirect straight to dashboard cockpit
      router.push('/student/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Hostel selection failed.');
      setShowConfirmModal(false);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Top Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/hostels" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-bold">
            <ArrowLeft size={20} />
            <span>Back to Listings</span>
          </Link>
          <div className="flex items-center gap-4">
             <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
                <AlertTriangle size={16} /> Report
             </button>
             <button 
               onClick={() => setShowConfirmModal(true)} 
               className="bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm"
             >
               Select Hostel
             </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Visuals - Left Column */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] bg-gray-100 rounded-[2rem] overflow-hidden shadow-2xl group">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentImage}
                  src={images[currentImage] || (hostel.name.toLowerCase().includes('gate') ? '/assets/gctu-gate.jpg' : hostel.name.toLowerCase().includes('admin') ? '/assets/gctu-admin.jpg' : hostel.name.toLowerCase().includes('reception') ? '/assets/gctu-reception.jpg' : '/assets/gctu-building.jpg')} 
                  alt={hostel.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white">
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <button 
                onClick={() => setZoomImage(images[currentImage])}
                className="absolute bottom-6 right-6 p-3 bg-black/50 backdrop-blur-md text-white rounded-xl hover:bg-black/70 transition-colors"
              >
                <Maximize2 size={20} />
              </button>
            </div>

            <div className="flex gap-4 mt-6 overflow-x-auto pb-4 scrollbar-hide">
              {images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentImage(i)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${i === currentImage ? 'border-primary ring-4 ring-primary/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Info className="text-primary" /> About this Hostel
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {hostel.description || "No description provided for this hostel."}
              </p>
              
              <div className="flex flex-wrap gap-4 mt-8">
                <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-colors border border-gray-100">
                  <Video size={18} /> Virtual Tour
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-colors border border-gray-100">
                  <Globe size={18} /> Location Map
                </button>
              </div>
            </div>
          </div>

          {/* Info - Right Column */}
          <div className="lg:col-span-5">
            <div className="sticky top-28">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified Listing
                  </span>
                </div>

                <h1 className="text-4xl font-black text-gray-900 mb-2">{hostel.name}</h1>
                
                <div className="flex items-center gap-2 text-gray-500 mb-8">
                  <MapPin size={18} className="text-primary" />
                  <span className="font-medium">{hostel.location_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-2xl text-center">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Campus</div>
                    <div className="text-sm font-black text-gray-800">{hostel.campus}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl text-center">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Students</div>
                    <div className="text-sm font-black text-gray-800 capitalize">{hostel.gender_rule.replace('_ONLY', 's').toLowerCase()}</div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <a 
                    href={`https://wa.me/${hostel.id}`}
                    className="flex items-center justify-center gap-3 w-full bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <MessageCircle size={22} />
                    Chat on WhatsApp
                  </a>
                  <a 
                    href={`tel:${hostel.id}`}
                    className="flex items-center justify-center gap-3 w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Phone size={22} />
                    Call Management
                  </a>
                </div>

                <div className="text-center">
                  <button className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest">
                    Report an issue with this listing
                  </button>
                </div>
              </div>

              {/* Quick Perks */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-blue-50/50 p-4 rounded-3xl text-center border border-blue-50">
                   <Wind className="mx-auto text-blue-500 mb-2" size={20} />
                   <span className="text-[10px] font-black text-blue-600 uppercase">A/C Units</span>
                </div>
                <div className="bg-purple-50/50 p-4 rounded-3xl text-center border border-purple-50">
                   <Wifi className="mx-auto text-purple-500 mb-2" size={20} />
                   <span className="text-[10px] font-black text-purple-600 uppercase">Fast WiFi</span>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-3xl text-center border border-amber-50">
                   <Zap className="mx-auto text-amber-500 mb-2" size={20} />
                   <span className="text-[10px] font-black text-amber-600 uppercase">Back-up</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Room Variants Section */}
        <section className="mt-24 border-t border-gray-100 pt-16">
          <div className="mb-12">
            <h2 className="text-3xl font-black mb-2 flex items-center gap-4">
              <Building2 className="text-primary" /> Room Variants & Pricing
            </h2>
            <p className="text-gray-500 font-medium">Select the room type that best fits your budget and lifestyle.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hostel.rooms?.map((room) => (
              <div key={room.id} className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-xl font-black text-gray-800">{room.room_number || "Standard Room"}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-black text-primary">GH₵{room.price}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Yearly</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <span className="text-xs font-bold">{room.capacity} Per Room</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                      <Bath size={16} />
                    </div>
                    <span className="text-xs font-bold">Ensuite</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {room.ac_available && (
                    <div className="flex items-center gap-3 text-blue-600">
                      <Wind size={16} />
                      <span className="text-xs font-black uppercase tracking-wide">Air Conditioning</span>
                    </div>
                  )}
                  {room.wifi_available && (
                    <div className="flex items-center gap-3 text-purple-600">
                      <Wifi size={16} />
                      <span className="text-xs font-black uppercase tracking-wide">High-speed WiFi</span>
                    </div>
                  )}
                  {room.kitchen_available && (
                    <div className="flex items-center gap-3 text-emerald-600">
                      <Utensils size={16} />
                      <span className="text-xs font-black uppercase tracking-wide">Kitchen Access</span>
                    </div>
                  )}
                </div>

                <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black group-hover:bg-primary transition-colors">
                  Select Room
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Image Zoom Overlay */}
      {zoomImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-8"
          onClick={() => setZoomImage(null)}
        >
          <button className="absolute top-8 right-8 text-white">
            <X size={40} />
          </button>
          <img 
            src={zoomImage} 
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            alt="Zoomed"
          />
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-100 p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Selection</h3>
                <p className="text-xs font-semibold text-slate-400">Locking hostel reservation</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-xs font-bold text-amber-800 leading-relaxed">
              ⚠️ WARNING: Once selected, you cannot switch or choose a different university hostel. The booking selection will be strictly locked to {hostel.name}.
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-xs font-bold text-red-800">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"
                disabled={bookingLoading}
              >
                Cancel Selection
              </button>
              <button 
                onClick={handleSelectHostel}
                className="py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-750 transition-colors flex items-center justify-center gap-1.5"
                disabled={bookingLoading}
              >
                {bookingLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Selection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
