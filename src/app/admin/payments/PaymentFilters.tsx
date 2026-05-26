import React from 'react';
import { Search } from 'lucide-react';

interface PaymentFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function PaymentFilters({ searchTerm, setSearchTerm }: PaymentFiltersProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl w-full max-w-sm">
      <Search size={16} className="text-slate-400 ml-1 flex-shrink-0" />
      <input 
        type="text" 
        placeholder="Search by student name or index..."
        className="bg-transparent border-none outline-none text-xs font-semibold w-full text-slate-800 focus:ring-0 placeholder-slate-400"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}
