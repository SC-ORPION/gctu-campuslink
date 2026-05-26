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
    <div className="bg-[#0a2240]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#1e5faf]/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-6">
      <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
        <Users size={16} className="text-indigo-600" /> Roommates ({roommates.length + 1} / {capacity})
      </h2>

      <div className="space-y-3">
        {/* Logged in student */}
        <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              ME
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-white">{primaryHolderName || ' Abraham Doe'}</div>
              <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">Primary Holder</div>
            </div>
          </div>
        </div>

        {/* Roommates */}
        {roommates.map((mate) => (
          <div key={mate.id} className="flex items-center justify-between p-3 bg-[#06182e]/40 rounded-xl border border-[#1e5faf]/15">
            <div className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-300 flex items-center justify-center font-bold text-xs uppercase">
                {mate.full_name?.slice(0, 2)}
              </div>
              <div>
                <div className="text-xs font-black text-slate-200">{mate.full_name}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Roommate</div>
              </div>
            </div>
          </div>
        ))}

        {roommates.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs italic font-bold">
            You are currently the sole occupant assigned to this room.
          </div>
        )}
      </div>
    </div>
  );
}
