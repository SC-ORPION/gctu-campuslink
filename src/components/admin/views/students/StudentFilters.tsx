import React from 'react';
import { Search } from 'lucide-react';

interface StudentFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function StudentFilters({ searchTerm, setSearchTerm }: StudentFiltersProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl w-full max-w-sm">
      <Search size={16} className="text-[#94A3B8] ml-1 flex-shrink-0" />
      <input 
        type="text" 
        placeholder="Search student name or index ID..."
        className="bg-transparent border-none outline-none text-sm font-semibold w-full text-[#0F172A] focus:ring-0 placeholder-[#94A3B8]"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}
