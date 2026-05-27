import React from 'react';
import { Users } from 'lucide-react';

interface Roommate {
  id: string;
  full_name: string;
}

interface RoommatesListProps {
  roommates: Roommate[];
  capacity: number;
  primaryHolderName?: string;
}

export default function RoommatesList({ roommates, capacity, primaryHolderName }: RoommatesListProps) {
  return (
    <div className="premium-card p-6 space-y-6">
      <h2 className="text-sm font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-2">
        <Users size={16} className="text-[#1D4ED8]" /> Roommates ({roommates.length + 1} / {capacity})
      </h2>

      <div className="space-y-3">
        {/* Logged in student */}
        <div className="flex items-center justify-between p-3 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-xs">
              ME
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#0F172A]">{primaryHolderName || ' Abraham Doe'}</div>
              <div className="text-[9px] font-bold text-[#1D4ED8] uppercase tracking-wider mt-0.5">Primary Holder</div>
            </div>
          </div>
        </div>

        {/* Roommates */}
        {roommates.map((mate) => (
          <div key={mate.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center font-bold text-xs uppercase">
                {mate.full_name?.slice(0, 2)}
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">{mate.full_name}</div>
                <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">Roommate</div>
              </div>
            </div>
          </div>
        ))}

        {roommates.length === 0 && (
          <div className="text-center py-6 text-[#94A3B8] text-xs italic font-medium">
            You are currently the sole occupant assigned to this room.
          </div>
        )}
      </div>
    </div>
  );
}
