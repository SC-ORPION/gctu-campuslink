'use client';

import React from 'react';

export default function SystemLoader() {
  return (
    <div className="w-full space-y-4">
      {/* Search/Filter Bar Skeleton */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="h-10 w-64 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-10 w-24 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-xl animate-pulse" />
      </div>

      {/* Grid or Cards Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="border border-[#1e5faf]/15 dark:border-zinc-800 rounded-2xl p-5 space-y-4 bg-white dark:bg-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-xl animate-pulse" />
              <div className="space-y-2 flex-grow">
                <div className="h-3 w-3/4 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
                <div className="h-3 w-1/2 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-[#1e5faf]/15 dark:border-zinc-800/80">
              <div className="h-2.5 w-full bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
              <div className="h-2.5 w-5/6 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="h-4 w-16 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
              <div className="h-8 w-24 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="border border-[#1e5faf]/15 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.3)] mt-8">
        <div className="h-12 bg-[#06182e]/40 dark:bg-zinc-800/50 border-b border-[#1e5faf]/15 dark:border-zinc-800/80 flex items-center px-4 justify-between">
          <div className="h-3 w-32 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="h-3 w-12 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="h-3 w-48 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
              <div className="h-3 w-20 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
              <div className="h-3 w-12 bg-[#0f3058]/30 dark:bg-zinc-800 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
